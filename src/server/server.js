import _ from 'lodash';
import {Namespace} from './namespace';

/**
 *
 */
export class ServerSocket {
  constructor(httpServer, options) {
    this.httpServer = httpServer;
    this.namespaces = [];

    this._options = _.defaults({}, options, {
      handshakeTimeout: 15000,
      heartbeatInterval: 15000,
      heartbeatTimeout: 10000,
      connectionTimeout: 30000
    });
  }

  /**
   * @param {String} name
   */
  of(name) {
    if (!name || typeof name !== 'string') {
      throw new TypeError('argument 1 must be a string');
    }

    if (_.isEmpty(name)) {
      name = null;
    }

    let server = _.find(this.namespaces, {name});
    if (!server) {
      server = new Namespace(this, name);
      this.namespaces.push(server);
    }

    return server;
  }

  /**
   * @param {any} data
   */
  send(data) {
    this.emit(null, data);
  }

  /**
   * @param {String} event
   * @param {any} data
   */
  emit(event, data) {
    return Promise.all(
      this.namespaces.map(namespace => namespace.emit(event, data))
    );
  }
}
