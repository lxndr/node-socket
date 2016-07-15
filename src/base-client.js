import _ from 'lodash';
import json5 from 'json5';
import {deffer} from './util';

const TYPE_ACK = 0;
const TYPE_ACKERR = 0;
const TYPE_PING = 1;
const TYPE_PONG = 2;
const TYPE_MESSAGE = 3;

export class BaseClient {
  constructor() {
    this._uuid = null;
    this._socket = null;
    this._queue = [];
    this._rooms = [];
    this._packetId = 0;
  }

  close() {
    if (this._socket) {
      this._socket.close();
      // this.in()._emit('close');
    }
  }

  send(data) {
    return this._emit(null, data);
  }

  _setSocket(socket) {
    this._socket = socket;

    this._socket.onmessage = event => {
      this._parse(event.data);
    };

    this._socket.onclose = event => {
      // this.in()._emit('disconnect');
    };

    this._socket.onerror = event => {
    };

    // this.in()._emit('connect');
    this._flush();
  }

  _parse(data) {
    data = json5.parse(data);
    if (!_.isArray(data)) {
      return;
    }

    const [type, id, ...args] = data;

    switch (type) {
      case TYPE_ACK: {
        const [packet] = _.remove(this._queue, packet => packet.id === id);
        if (packet && packet.deffered) {
          packet.deffered.resolve(args[0]);
        }
        break;
      }
      case TYPE_PING:
        this._ping();
        break;
      case TYPE_PONG:
        // emit('pong');
        break;
      case TYPE_MESSAGE: {
        const [room, name, payload] = args;
        this.in(room)
          ._emit(name, payload)
          .then(
            data => this._ack(id, data),
            err => this._ack(id, err)
          );
        break;
      }
      default:
        return;
    }
  }

  _ack(id, payload) {
    if (payload instanceof Error) {
      this._enqueue(TYPE_ACKERR, id, payload.message);
    } else {
      this._enqueue(TYPE_ACK, id, payload);
    }
  }

  _ping() {
    this._enqueue(TYPE_PING);
  }

  _pong() {
    this._enqueue(TYPE_PONG);
  }

  _emit(room, name, payload) {
    if (name === 'message') {
      name = null;
    }

    const packet = this._enqueue(TYPE_MESSAGE, this._packetId++, _.take(arguments), true);
    return packet.deffered.promise;
  }

  _enqueue(type, id, data, deffered) {
    const _data = [type];
    const packet = {type, sent: false};

    if (id) {
      data.push(id);
      packet.id = id;
    }

    if (data) {
      data.push(...data);
    }

    if (deffered) {
      packet.deffered = deffer();
    }

    packet.data = json5.stringify(_data);
    this.queue.push(packet);
    this._flush();
    return packet;
  }

  _flush() {
    if (!(this._socket && this._isSocketOpen())) {
      return;
    }

    _(this._queue)
      .filter({sent: false})
      .each(packet => {
        this._send(packet.data, err => {
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
