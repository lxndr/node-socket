import EventEmitter from 'events';
import Url from 'url';
import _ from 'lodash';
import ws from 'ws';
import {Client} from './client';
import {Room} from './room';
import {log} from '../util';

export class Namespace extends EventEmitter {
  constructor(manager, name) {
    super();
    this.manager = manager;
    this.name = name;
    this.clients = [];
    this._pendingClients = [];

    this.socket = new ws.Server({
      server: this.manager.httpServer,
      path: name,
      clientTracking: false,
      verifyClient: (info, cb) => {
        this._verifyClient(info, cb);
      }
    });

    this.socket.on('connection', _.bindKey(this, '_connection'));
  }

  _verifyClient(info, cb) {
    const uuid = _.get(Url.parse(info.req.url, true), 'query.uuid');

    if (!uuid) {
      cb(false, 401, 'Client did not provided UUID');
      return;
    }

    let client = _.find(this.clients, {uuid});
    if (client) {
      cb(true);
      return;
    }

    _.remove(this._pendingClients, {uuid});

    client = new Client(uuid, this.manager.options);
    this._pendingClients.push(client);

    const timeoutId = setTimeout(() => {
      log(`[${uuid}] timed out for shandshake`);
      _.pull(this._pendingClients, client);
    }, this.manager.options.handshakeTimeout);

    client.once('connect', () => {
      clearTimeout(timeoutId);
    });

    if (this.verifyClient) {
      this.verifyClient(client, info.req, cb);
    } else {
      cb(true);
    }
  }

  _connection(socket) {
    const uuid = _.get(Url.parse(socket.upgradeReq.url, true), 'query.uuid');
    let client = _.find(this.clients, {uuid});

    if (!client) {
      client = _.remove(this._pendingClients, {uuid})[0];
      client.once('close', () => {
        _.pull(this.clients, client);
      });

      log(`[${uuid}] open`);
      this.clients.push(client);
      super.emit('open', client);
    }

    client._setSocket(socket);
  }

  /**
  * @param {String} name
  */
  in(name) {
    return new Room(this, name);
  }

  emit(event, data) {
    return Promise.all(
      this.clients.map(client => client.emit(event, data))
    );
  }
}
