import _ from 'lodash';
import WebSocket from 'ws';
import json5 from 'json5';
import {EventEmitter} from 'events';
import {deffer} from '../util';

const $socket = Symbol('websocket client');
const $queue = Symbol('outgoing queue');
const $rooms = Symbol('rooms');

/**
 * Class representing a client connection
 */
export class Client extends EventEmitter {
  constructor(uuid) {
    super();
    this.uuid = uuid;
    this[$socket] = null;
    this[$queue] = [];
    this[$rooms] = [];
  }

  /**
   * @property {ws.WebSocket}
   */
  get socket() {
    return this[$socket];
  }

  set socket(socket) {
    this[$socket] = socket;
    super.emit('connect');

    this[$socket].on('close', () => {
      this[$socket] = null;
      super.emit('disconnect');
    });

    this[$socket].on('message', (buffer, flags) => {
      if (!flags.binary) {
        this._parse(buffer);
      }
    });
  }

  /**
   * @private
   */
  _parse(data) {
    data = json5.parse(data);
    if (!_.isArray(data)) {
      return;
    }

    const [type, id, ...args] = data;

    switch (type) {
      case 0: { /* acknowlegment */
        const [packet] = _.remove(this[$queue], packet => packet.id === id);
        if (packet && packet.deffered) {
          packet.deffered.resolve(args[0]);
        }

        break;
      }
      case 1:
        this._pong();
        break;
      case 3: { /* message */
        const [room, name, payload] = args;
        this._ack(id);
        // EventEmitter.prototype.emit.call(this.in(room), name, payload);
        break;
      }
      default:
        break;
    }
  }

  on(...args) {
    this.in().on(...args);
  }

  /**
   * Sends structured data to the client.
   * @param {String} [name] - The name of the message.
   * @param {any} data
   * @returns {Promise|null}
   */
  emit(...args) {
    return this.in().emit(...args);
  }

  _emit(room, name, payload) {
    const id = this.packetId++;
    const packet = {
      type: 3,
      sent: false,
      id,
      deffered: deffer(),
      data: json5.stringify([3, id, room, name, payload])
    };

    this._enqueue(packet);
    return packet.deffered.promise;
  }

  _ack(id) {
    const packet = {
      type: 0,
      sent: false,
      id,
      data: json5.stringify([0, id])
    };

    this._enqueue(packet);
  }

  _pong() {
    const packet = {
      type: 2,
      sent: false,
      data: json5.stringify([2])
    };

    this._enqueue(packet);
  }

  _enqueue(packet) {
    this[$queue].push(packet);
    this._flush();
  }

  _flush() {
    if (!(this[$socket] && this[$socket].readyState === WebSocket.OPEN)) {
      return;
    }

    _(this[$queue])
      .filter({sent: false})
      .each(packet => {
        this[$socket].send(packet.data, err => {
          packet.sent = true;

          if (err) {
            if (packet.deferred) {
              packet.deferred.reject(err);
            }
            return;
          }
        });
      });

    _.remove(this.queue, packet => {
      return packet.sent === true && !packet.deffered;
    });
  }
}
