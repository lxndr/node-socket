import _ from 'lodash';
import {Namespace} from './namespace';

/**
 *
 */
export class ServerSocket {
  constructor(httpServer, options) {
    this.httpServer = httpServer;
    this.namespaces = [];

    this._options = {
      handshakeTimeout: 15000,
      heartbeatInterval: 15000,
      heartbeatTimeout: 10000,
      connectionTimeout: 30000,
      ...options
    };
  }

  /**
   * @param {String} name
   */
  of(name = null) {
    let ns = _.find(this.namespaces, {name});

    if (!ns) {
      ns = new Namespace(this, name);
      this.namespaces.push(ns);
    }

    return ns;
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
