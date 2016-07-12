import _ from 'lodash';
import json5 from 'json5';
import EventEmitter from 'events';
import Url from 'url';

class FakeRoom {
  on() {}
  emit() {}
}

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
    const packet = {type};

    switch (type) {
      case 0: {
        const [id, payload] = args;
        packet.push(id);
        if (!_.isUndefined(payload)) {
          packet.push(payload);
        }
        break;
      }
      case 2:
        break;
      case 3: {
        const id = this.packetId++;
        packet.data = json5.stringify([3, id, ...args]);
        break;
      }
      default:
        return;
    }

    this.queue.push(packet);
    this._flush();
    return packet;
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
      case 0: { /* acknowlegment */
        const [payload] = args;
        const [packet] = _.remove(this.packets, packet => {
          return packet.sent && packet.id === id;
        });

        if (packet) {
          packet.cb(payload);
        }

        break;
      }
      case 1: /* ping */
        this._send(1);
        break;
      case 2: {
        const [room, name, payload] = args;

        if (room) {
          const r = _.find(this.rooms, ['name', room]);
          if (r) {
            r._emit(name, payload);
          }
        } else {
          super.emit(name, payload);
        }
        break;
      }
      default:
        return;
    }
  }

  in(room) {
    const r = _.find(this.rooms, [name, room]);
    return r ? r : new FakeRoom();
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
