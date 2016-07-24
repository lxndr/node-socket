import _ from 'lodash';
import {Namespace} from './namespace';

/**
 *
 */
export class ServerSocket {
  constructor(httpServer, options) {
    this.httpServer = httpServer;
    this.namespaces = [];

    this.options = _.defaults({}, options, {
      heartbeatInterval: 15000,
      heartbeatTimeout: 10000,
      connectionTimeout: 30000
    });
  }

  /**
   * @param {String} name
   */
  of(name) {
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
