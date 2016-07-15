import _ from 'lodash';
import WebSocket from 'ws';
import {BaseClient} from '../base-client';

/**
 * Class representing a client connection
 */
export class Client extends BaseClient {
  constructor(uuid) {
    super();
    this.uuid = uuid;
  }

  emit(name, data) {
    return this._emit(null, name, data);
  }

  _send(...args) {
    this._socket.send(...args);
  }

  _isSocketOpen() {
    return this._socket.readyState === WebSocket.OPEN;
  }
}
