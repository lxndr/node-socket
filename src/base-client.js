import _ from 'lodash';
import {Room, FakeRoom} from './room';
import {log, deffer} from './util';

const TYPE_ACKERR = -1;
const TYPE_ACK = 0;
const TYPE_PING = 1;
const TYPE_PONG = 2;
const TYPE_MESSAGE = 3;

export class BaseClient {
  constructor(uuid) {
    this._uuid = uuid;
    this._socket = null;
    this._queue = [];
    this._rooms = [];
    this._packetId = 0;
    this._closed = false;
    this._ensureRoom(null);
  }

  close() {
    this._closed = true;
    this._closeSocket();
  }

  get uuid() {
    return this._uuid;
  }

  get connected() {
    return Boolean(this._socket);
  }

  _findRoom(name) {
    return _.find(this._rooms, ['name', name]);
  }

  _ensureRoom(name) {
    let room = this._findRoom(name);

    if (!room) {
      room = new Room(this, name);
      this._rooms.push(room);
    }

    return room;
  }

  _removeRoom(name) {
    const rooms = _.remove(this._rooms, room => room.name === name);
    rooms.forEach(room => room.removeAllListeners());
  }

  in(name = null) {
    const room = this._findRoom(name);
    return room ? room : new FakeRoom(name);
  }

  on(event, cb) {
    this.in().on(event, cb);
  }

  send(data) {
    return this.emit(null, data);
  }

  emit(name, data) {
    return this.in().emit(name, data);
  }

  _closeSocket() {
    if (this._socket) {
      this._socket.onopen = null;
      this._socket.onmessage = null;
      this._socket.onclose = null;
      this._socket.onerror = null;
      this._socket.close();
      this._socket = null;
      this.in().dispatch('disconnect');
    }
  }

  /**
   * onclose event handler for native socket
   * @private
   */
  _onclose(event) {
    log(`disconnected (wasClean: ${event.wasClean}, reason: ${event.reason})`);
    this._closeSocket();

    if (event.wasClean) {
      this.close();
      this.in().dispatch('close');
    }
  }

  /**
   * prepares open native socket
   * @private
   */
  _setSocket(socket) {
    log(`connected`);

    this._closeSocket();
    this._socket = socket;

    this._socket.onmessage = event => {
      this._parse(event.data);
    };

    this._socket.onclose = _.bindKey(this, '_onclose');

    this._socket.onerror = () => {
      log(`errored`);
      this.in().dispatch('error');
    };

    this.in().dispatch('connect');
    this._flush();
  }

  _parse(data) {
    data = JSON.parse(data);
    if (!_.isArray(data)) {
      return;
    }

    const [type, id, ...args] = data;

    switch (type) {
      case TYPE_ACK:
      case TYPE_ACKERR: {
        const [packet] = _.remove(this._queue, packet => packet.id === id);
        if (packet && packet.deffered) {
          const fn = type === TYPE_ACK ? packet.deffered.resolve : packet.deffered.reject;
          fn.call(this, args[0]);
        }
        break;
      }
      case TYPE_PING:
        this._pong();
        break;
      case TYPE_PONG:
        this.in().dispatch('pong');
        break;
      case TYPE_MESSAGE: {
        const [room, event, payload] = args;

        if (room === null && event === 'join') {
          this.in()
            .dispatch(event, payload)
            .then(
              () => this._ack(id),
              err => this._ack(id, err)
            );
          return;
        }

        if (room === null && event === 'leave') {
          this.in()
            .dispatch(event, payload)
            .then(
              () => this._ack(id),
              err => this._ack(id, err)
            );
          return;
        }

        this.in(room)
          .dispatch(event, payload)
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
      this._enqueue(TYPE_ACKERR, id, [payload.message]);
    } else {
      this._enqueue(TYPE_ACK, id, [payload]);
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

    const packet = this._enqueue(TYPE_MESSAGE, this._packetId++, _.take(arguments, 3), true);
    return packet.deffered.promise;
  }

  _enqueue(type, id, data, deffered) {
    const _data = [type];
    const packet = {type, sent: false};

    if (id !== undefined) {
      _data.push(id);
      packet.id = id;
    }

    if (data !== undefined) {
      data = _.dropRightWhile(data, _.isUndefined);
      _data.push(...data);
    }

    if (deffered) {
      packet.deffered = deffer();
    }

    packet.data = JSON.stringify(_data);
    this._queue.push(packet);
    this._flush();
    return packet;
  }

  _flush() {
    if (!this._socket) {
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

    _.remove(this._queue, packet => {
      return packet.sent === true && !packet.deffered;
    });
  }
}
