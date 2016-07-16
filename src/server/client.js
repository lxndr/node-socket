import {BaseClient} from '../base-client';

/**
 * Class representing a client connection
 */
export class Client extends BaseClient {
  _send(data, cb) {
    this._socket.send(data, cb);
  }
}
