import _ from 'lodash';
import json5 from 'json5';
import EventEmitter from 'events';
import Url from 'url';

class Room extends EventEmitter {
  constructor(socket, room) {
    super();
    this.socket = socket;
    this.room = room;
  }

  on(name, cb) {

  }

  emit(name, data) {

  }
}

/**
 * Browser client.
 * @memberof client
 */
export class SocketClient extends EventEmitter {
  constructor(url, options = {}) {
    super();
    this.rooms = new Set();
    this.ws = null;
    this.uuid = null;
    this.packetId = 0;

    const urlObject = _(Url.parse(url))
      .pick(['hostname', 'port', 'path'])
      .omitBy(_.isNil)
      .defaults({
        protocol: location.protocol === 'https:' ? 'wss' : 'ws',
        slashes: true,
        hostname: location.hostname,
        port: location.port
      })
      .value();

    this.url = Url.format(urlObject);

    this.options = options;
    _.defaults(this.options, {
      timeout: 10000,
      reconnectCooldown: 2500
    });
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this._send(1);
    };

    this.socket.onclose = event => {
      super.emit('disconnect');

      setTimeout(() => {
        this.connect();
      }, this.options.reconnectCooldown);
    };

    this.socket.onmessage = data => {
      this._parse(data);
    };
  }

  _send(type, ...args) {
    const id = this.packetId++;
    const packet = [type, id];

    switch (type) {
      case 0:
        if (this.uuid) {
          packet.push(this.uuid);
        }
        break;
      case 2:
        break;
      case 3:
        packet.push(...args);
        break;
      default:
        return;
    }

    this.queue.push(packet);
    this._flush();
  }

  _flush() {
    for (;;) {
      const packet = this.queue.unshift();
      if (!packet) {
        return;
      }


    }
  }

  _parse(data) {
    data = json5.parse(data);
    if (!_.isArray(data)) {
      return;
    }

    const [type, id, ...args] = data;

    switch (type) {
      case 0:
        [this.uuid] = args;
        super.emit('connect');
        break;
      case 3: {
        const [room, name, payload] = args;
        const [packet] = _.remove(this.packets, packet => {
          return packet.id === id && _.eq(packet.room, room);
        });

        if (!packet) {
          return;
        }

        this._send(4, packet.id);
        this.emit(name, payload);
        break;
      }
      default:
        return;
    }
  }

  in(room) {

  }

  async join(room) {
    await this.emit('join', room);
    this.rooms.add(room);
  }

  async leave(room) {
    await this.emit('leave', room);
    this.rooms.delete(room);
  }

  emit(name, data) {
    return new Promise((resolve, reject) => {
      this.ws.send(data);
    });
  }
}
