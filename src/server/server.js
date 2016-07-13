import _ from 'lodash';
import {Namespace} from './namespace';

export class ServerSocket {
  constructor(httpServer) {
    this.httpServer = httpServer;
    this.namespaces = [];
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
   * @param {String} [name]
   * @param {any} data
   */
  emit(...args) {
    return Promise.all(
      this.namespaces.map(namespace => namespace.emit(...args))
    );
  }
}
