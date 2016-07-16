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

  _send(data, cb) {
    this._socket.send(data, cb);
  }

  _isSocketOpen() {
    return this._socket.readyState === WebSocket.OPEN;
  }
}
