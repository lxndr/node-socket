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
        client.on('close', () => {
          _.pull(this.clients, client);
        });

        if (this.verifyClient) {
          this.verifyClient(client, info.req, (accept, code, result) => {
            if (accept === true) {
              this.clients.push(client);
            }
            cb(accept, code, result);
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
      client._setSocket(socket);
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
}
