import _ from 'lodash';
import json5 from 'json5';
import EventEmitter from 'events';
import Url from 'url';
import UUID from 'uuid';
import {deffer, Interval} from '../util';

class Room extends EventEmitter {
  constructor(socket, name = null) {
    super();
    this.socket = socket;
    this.name = name;
  }

  emit(...args) {
    let name = null;
    let payload = null;

    if (args.length === 1) {
      [payload] = args;
    } else {
      [name, payload] = args;
      if (name === 'message') {
        name = null;
      }
    }

    return this.socket._emit(this.name, name, payload);
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
export class SocketClient {
  constructor(url, options = {}) {
    this.rooms = [];
    this.ws = null;
    this.uuid = UUID.v4();
    this.packetId = 0;
    this.queue = [];
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
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.in()._emit('connect');
      this.pingInterval.start();
      this._flush();
    };

    this.socket.onclose = event => {
      console.log(event);
      this.in()._emit('disconnect');

      setTimeout(() => {
        this.connect();
      }, this.options.reconnectCooldown);
    };

    this.socket.onmessage = event => {
      this._parse(event.data);
    };
  }

  close() {
    if (this.socket) {
      this.pingInterval.stop();
      this.socket.close();
      this.in()._emit('close');
    }
  }

  _findRoom(name) {
    return _.find(this.rooms, ['name', name]);
  }

  _ensureRoom(name) {
    let room = this._findRoom(name);

    if (!room) {
      room = new Room(this, name);
      this.rooms.push(room);
    }

    return room;
  }

  _removeRoom(name) {
    const rooms = _.remove(this.rooms, room => room.name === name);
    rooms.forEach(room => {
      room.eventNames().forEach(event => room.removeAllListeners(event));
    });
  }

  _parse(data) {
    data = json5.parse(data);
    if (!_.isArray(data)) {
      return;
    }

    const [type, id, ...args] = data;

    switch (type) {
      case 0: { /* acknowlegment */
        const [packet] = _.remove(this.queue, packet => packet.id === id);
        if (packet && packet.deffered) {
          packet.deffered.resolve(args[0]);
        }

        break;
      }
      case 2: /* pong */
        break;
      case 3: { /* message */
        const [room, name, payload] = args;
        this._ack(id);
        this.in(room)._emit(name, payload);
        break;
      }
      default:
        return;
    }
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
   * @param {String} [name]
   * @param {any} data
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

  _ping() {
    const packet = {
      type: 1,
      sent: false,
      data: json5.stringify([1])
    };

    this._enqueue(packet);
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

  _enqueue(packet) {
    this.queue.push(packet);
    this._flush();
  }

  _flush() {
    if (!(this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    _(this.queue)
      .filter({sent: false})
      .each(packet => {
        this.socket.send(packet.data);
        packet.sent = true;
      });

    _.remove(this.queue, packet => {
      return packet.sent === true && !packet.deffered;
    });
  }
}
