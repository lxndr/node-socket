import Url from 'url';
import _ from 'lodash';
import ws from 'ws';
import {Client} from './client';
import {Room} from './room';

export class Namespace {
  constructor(manager, name) {
    this.manager = manager;
    this.name = name;
    this.clients = [];

    this.socket = new ws.Server({
      server: this.manager.httpServer,
      path: name,
      verifyClient: (info, cb) => {
        const query = Url.parse(info.req.url, true).query;

        if (!query.uuid) {
          cb(false, 401, 'Client did not provided UUID');
          return;
        }

        let client = _.find(this.clients, ['uuid', query.uuid]);
        if (client) {
          cb(true);
          return;
        }

        client = new Client(query.uuid);

        if (this.verifyClient) {
          this.verifyClient(client, info.req, (...args) => {
            if (args[0] === true) {
              this.clients.push(client);
            }
            cb(...args);
          });
        } else {
          this.clients.push(client);
          cb(true);
        }
      }
    });

    this.socket.on('connection', socket => {
      const query = Url.parse(socket.upgradeReq.url, true).query;
      const client = _.find(this.clients, ['uuid', query.uuid]);
      client.socket = socket;
    });
  }

  /**
  * @param {String} name
  */
  in(name) {
    return new Room(this, name);
  }

  on() {}

  emit(...args) {
    return Promise.all(
      this.clients.map(client => client.emit(...args))
    );
  }

  _dispatch(packet) {

  }
}
