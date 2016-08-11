import _ from 'lodash';
import {Room, FakeRoom} from './room';
import {Evented} from './evented';
import {log, defer} from './util';

const TYPE_ACKERR = 0;
const TYPE_ACK = 1;
const TYPE_PING = 2;
const TYPE_PONG = 3;
const TYPE_MESSAGE = 4;

export const CLOSE_REPLACED = 3001;
export const CLOSE_TIMEOUT = 3002;

const reservedEvents = ['open', 'connect', 'disconnect', 'beforeJoin', 'join', 'leave', 'pong', 'close'];

export default class BaseClient extends Evented {
  constructor(uuid = null, options = {}) {
    super();
    this._uuid = uuid;
    this._options = options;
    this._socket = null;
    this._queue = [];
    this._rooms = [];
    this._packetId = 0;
    this._closed = false;
    this._ackPromise = Promise.resolve();
    this._ensureRoom(null);
  }

  /**
   * Closes the socket and releases all its resources so that garbage collector could free it.
   * This method might emit 'close' event. Do not do anything with a closed socket.
   */
  close() {
    if (!this._closed) {
      this._ackPromise.then(() => {
        this._closed = true;
        this._rooms.forEach(room => room.removeAllListeners());
        this._disconnect();
        this._onclose();
        this.dispatchEvent('close');
      });
    }
  }

  /**
   * Unique ID. It is generated upon socket creation.
   * @type String
   */
  get uuid() {
    return this._uuid;
  }

  get connected() {
    return Boolean(this._socket);
  }

  /**
   * Indicated that the socket has been closed.
   * @type Boolean
   * @see #close
   */
  get closed() {
    return this._closed;
  }

  _findRoom(name) {
    return _.find(this._rooms, {name});
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
    if (_.includes(reservedEvents, event)) {
      super.on(event, cb);
    } else {
      this.in().on(event, cb);
    }
  }

  once(event, cb) {
    if (_.includes(reservedEvents, event)) {
      super.once(event, cb);
    } else {
      this.in().once(event, cb);
    }
  }

  send(data) {
    return this.emit(null, data);
  }

  emit(name, data) {
    return this.in().emit(name, data);
  }

  /**
   * Closes underlying native socket.
   * @private
   */
  _disconnect(code, reason) {
    if (this._socket) {
      this._socket.onopen = null;
      this._socket.onmessage = null;
      this._socket.onclose = null;
      this._socket.onerror = null;
      this._socket.close(code, reason);
      this._socket = null;
      this._ondisconnect(code, reason);
    }
  }

  /**
   * onclose event handler for native socket
   * @private
   */
  _ondisconnect(code, reason) {
    log(`[${this.uuid}] disconnected (code: ${code}, reason: ${reason})`);

    if (this._socket) {
      this._socket.onopen = null;
      this._socket.onmessage = null;
      this._socket.onclose = null;
      this._socket.onerror = null;
      this._socket = null;
    }

    this.dispatchEvent('disconnect', {code, reason});

    if (code === 1000) {
      this.close();
    }
  }

  _onclose() {
    log(`[${this.uuid}] closed`);
  }

  _onpong() {
  }

  _onerror(err) {
    log(`[${this.uuid}] errored: ${err.message}`);
    this.dispatchEvent('error', err);
  }

  /**
   * prepares open native socket
   * @private
   */
  _onconnect(socket) {
    this._disconnect(CLOSE_REPLACED, 'replaced');
    this._socket = socket;
    log(`[${this.uuid}] connected`);

    this._socket.onmessage = event => {
      this._parse(event.data);
    };

    this._socket.onclose = event => {
      this._ondisconnect(event.code, event.reason);
    };

    this._socket.onerror = () => {
      this._onerror();
    };

    this.dispatchEvent('connect');
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
        if (packet && packet.deferred) {
          const fn = type === TYPE_ACK ? packet.deferred.resolve : packet.deferred.reject;
          fn.call(this, args[0]);
        }
        break;
      }
      case TYPE_PING:
        this._pong();
        break;
      case TYPE_PONG:
        this._onpong();
        this.dispatchEvent('pong');
        break;
      case TYPE_MESSAGE:
        this._onmessage(id, ...args);
        break;
      default:
        return;
    }
  }

  _onmessage(id, room, event, payload) {
    this._ackPromise = this._ackPromise.then(async () => {
      try {
        if (room === null && event === 'join') {
          const roomName = payload;
          await this.dispatchEvent(event, roomName);
          this._ensureRoom(roomName);
          this._ack(id);
          return;
        }

        if (room === null && event === 'leave') {
          const roomName = payload;
          await this.dispatchEvent(event, roomName);
          this._removeRoom(roomName);
          this._ack(id);
          return;
        }

        const response = await this.in(room).dispatchEvent(event || 'message', payload);
        this._ack(id, response);
      } catch (err) {
        this._ack(id, err);
      }
    });
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

    const packet = this._enqueue(TYPE_MESSAGE, this._packetId++, [room, name, payload], true);
    return packet.deferred.promise;
  }

  _enqueue(type, id, data, deferred) {
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

    if (deferred) {
      packet.deferred = defer();
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
        packet.sent = true;
        this._send(packet.data, err => {
          if (err && packet.deferred) {
            packet.deferred.reject(err);
          }
        });
      });

    _.remove(this._queue, packet => {
      return packet.sent === true && !packet.deferred;
    });
  }

  _send() {
  }
}
