import {BaseClient} from '../base-client';

/**
 * Class representing a client connection
 */
export class Client extends BaseClient {
  constructor(uuid, options) {
    super(uuid);
    this._options = options;
    this._heartbeatTimer = null;
  }

  _setSocket(socket) {
    super._setSocket(socket);
    this._resetHeartbeatTimeout();
  }

  _closeSocket() {
    super._closeSocket();
    this._stopHeartbeatTimeout();
  }

  _parse(...args) {
    super._parse(...args);
    this._resetHeartbeatTimeout();
  }

  _send(data, cb) {
    this._socket.send(data, cb);
  }

  _resetHeartbeatTimeout() {
    if (this._heartbeatTimer) {
      clearTimeout(this._heartbeatTimer);
    }

    this._heartbeatTimer = setTimeout(() => {
      this._closeSocket();
    }, this._options.heartbeatInterval + this._options.heartbeatTimeout);
  }

  _stopHeartbeatTimeout() {
    if (this._heartbeatTimer) {
      clearTimeout(this._heartbeatTimer);
    }
  }
}
