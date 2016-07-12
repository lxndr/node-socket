import json5 from 'json5';
import {EventEmitter} from 'events';
import {deffer} from '../util';

const $socket = Symbol('websocket client');
const $queue = Symbol('outgoing queue');

/**
 * Class representing a client connection
 * @extends Evented
 */
export class SocketClient extends EventEmitter {
  constructor() {
    super();
    this[$socket] = null;
    this[$queue] = [];
    this.rooms = [];
    this.latency = null;
  }

  get socket() {
    return this[$socket];
  }

  /**
   * @property {ws.WebSocket}
   * @private
   */
  set socket(socket) {
    this[$socket] = socket;
    super.emit('connect');

    this[$socket].on('close', () => {
      this[$socket] = null;
      super.emit('disconnect');
    });

    this[$socket].on('message', (buffer, flags) => {
      if (flags.binary) {

      } else {
        this.parsePacket(buffer);
      }
    });
  }

  /**
   * @private
   */
  parsePacket(buffer) {
    const packet = json5.parse(buffer);
    const type = packet[0];

    switch (type) {
      case 0:
          // ack
        break;
      /* message */
      case 1:
        const [, name, data] = packet;
        super.emit(name, data);
        break;
      default:
        break;
    }
  }

  /**
   * Sends structured data to the client.
   * @param {String} [name] - The name of the message.
   * @param {any} data
   * @returns {Promise|null}
   */
  emit(...args) {
    const [name, data] = args.length > 1 ? args : [null, args[0]];

    const packet = {
      type: 1,
      name,
      data,
      deferred: deffer()
    };

    this[$queue].push(packet);
    this.flushQueue();
  }

  /**
   * @private
   */
  flushQueue() {
    if (!this[$socket]) {
      return;
    }

    for (const packet of this[$queue]) {
      this[$socket].send(packet.buffer, err => {
        if (err) {
          if (packet.deferred) {
            packet.deferred.reject(err);
          }
        }
      });
    }
  }
}
