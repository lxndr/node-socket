import _ from 'lodash';
import {Namespace} from './namespace';

/**
 * @class Manager
 */
export class Manager {
  constructor() {
    this.namespaces = [];
    this.clients = [];
  }

  of(namespace) {
    if (_.isEmpty(namespace)) {
      namespace = '';
    }

    let server = _.find(this.namespaces, {name: namespace});
    if (!server) {
      server = new Namespace(namespace);
      servers.push(server);
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
