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

export class Namespace extends Evented {
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

    client = new Client(uuid, this.manager._options);
    this._pendingClients.push(client);

    const timeoutId = setTimeout(() => {
      log(`[${uuid}] timed out for shandshake`);
      _.pull(this._pendingClients, client);
    }, this.manager._options.handshakeTimeout);

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
