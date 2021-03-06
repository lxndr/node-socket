import Url from 'url';
import _ from 'lodash';
import ws from 'ws';
import {mix} from 'mixwith';
import BaseClient from '../base-client';
import NodejsMixin from '../mixins/nodejs';
import HeartbeatTimeoutMixin from '../mixins/heartbeat-timeout';
import ConnectionTimeoutMixin from '../mixins/connection-timeout';
import {Evented} from '../evented';
import {Room} from './room';
import {log} from '../util';

class Client extends mix(BaseClient).with(NodejsMixin, HeartbeatTimeoutMixin, ConnectionTimeoutMixin) {}

export class ServerSocket extends Evented {
  constructor(httpServer, options) {
    super();
    this.clients = [];
    this._pendingClients = [];

    this._options = _.defaults({}, options, {
      handshakeTimeout: 15000,
      heartbeatInterval: 15000,
      heartbeatTimeout: 10000,
      connectionTimeout: 30000
    });

    this.socket = new ws.Server({
      server: httpServer,
      path: this._options.path,
      clientTracking: false,
      verifyClient: (info, cb) => {
        this._verifyClient(info).then(() => {
          cb(true);
        }, err => {
          cb(false, 401, err.message);
        });
      }
    });

    this.socket.on('connection', _.bindKey(this, '_connection'));
  }

  async _verifyClient(info) {
    const id = Url.parse(info.req.url, true).query.id;

    if (!id) {
      throw new Error('Client did not provided ID');
    }

    let client = _.find(this.clients, {id});

    if (client) {
      return;
    }

    _.remove(this._pendingClients, {id});

    client = new Client(id, this._options);
    this._pendingClients.push(client);

    const timeoutId = setTimeout(() => {
      log(`[${id}] timed out for shandshake`);
      _.pull(this._pendingClients, client);
    }, this._options.handshakeTimeout);

    client.once('connect', () => {
      clearTimeout(timeoutId);
    });

    if (this._options.verifyClient) {
      await this._options.verifyClient(client, info.req);
    }
  }

  _connection(socket, req) {
    const id = Url.parse(req.url, true).query.id;
    let client = _.find(this.clients, {id});

    if (!client) {
      client = _.remove(this._pendingClients, {id})[0];
      client.once('close', () => {
        _.pull(this.clients, client);
      });

      log(`[${id}] open`);
      this.clients.push(client);
      this.dispatchEvent('open', client);
      client.dispatchEvent('open');
    }

    client._onconnect(socket);
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
