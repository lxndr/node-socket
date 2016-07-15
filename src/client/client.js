import _ from 'lodash';
import EventEmitter from 'events';
import Url from 'url';
import UUID from 'uuid';
import {BaseClient} from '../base-client';
import {Interval} from '../util';

class Room extends EventEmitter {
  constructor(socket, name = null) {
    super();
    this.socket = socket;
    this.name = name;
  }

  emit(name, data) {
    if (name === 'message') {
      name = null;
    }

    return this.socket._emit(this.name, name, data);
  }

  _emit(...args) {
    super.emit(...args);
  }
}

class FakeRoom {
  constructor(name) {
    this.name = name;
    console.log('Attempt to enter room', name, 'which does not exist');
  }

  on() {}
  emit() {}
  _emit() {}
}

/**
 * Browser client.
 * @memberof client
 */
export class SocketClient extends BaseClient {
  constructor(url, options = {}) {
    super();
    this.uuid = UUID.v4();
    this.options = _.defaults({}, options, {
      timeout: 10000,
      reconnectCooldown: 2500
    });

    const urlObject = _(Url.parse(url))
      .pick(['hostname', 'port', 'pathname'])
      .omitBy(_.isNil)
      .defaults({
        protocol: location.protocol === 'https:' ? 'wss' : 'ws',
        slashes: true,
        hostname: location.hostname,
        port: location.port,
        query: {
          uuid: this.uuid
        }
      })
      .value();

    this.url = Url.format(urlObject);
    this.pingInterval = new Interval(this.options.timeout, _.bindKey(this, '_ping'));

    this._ensureRoom()
      .on('join', name => {
        console.log('join:', name);
        this._ensureRoom(name);
      })
      .on('leave', name => {
        console.log('leave:', name);
        this._removeRoom(name);
      });

    this.on('disconnect', () => {
      setTimeout(() => {
        this.connect();
      }, this.options.reconnectCooldown);
    });
  }

  connect() {
    this._socket = new WebSocket(this.url);

    this._socket.onopen = () => {
      this.pingInterval.start();
      this._setSocket(this._socket);
    };
  }

  close() {
    this.pingInterval.stop();
    super.close();
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
    rooms.forEach(room => {
      room.eventNames().forEach(event => room.removeAllListeners(event));
    });
  }

  in(name = null) {
    const room = this._findRoom(name);
    return room ? room : new FakeRoom(name);
  }

  async join(room) {
    await this.emit('join', room);
    return this.in(room);
  }

  leave(room) {
    return this.emit('leave', room);
  }

  on(...args) {
    this.in().on(...args);
  }

  /**
   * @param {String} name
   * @param {any} [data]
   */
  emit(...args) {
    return this.in().emit(...args);
  }

  _send(data, cb) {
    this._socket.send(data);
    cb(null);
  }

  _isSocketOpen() {
    return this._socket.readyState === WebSocket.OPEN;
  }
}
