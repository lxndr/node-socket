import {BaseClient} from '../base-client';

/**
 * Class representing a client connection
 */
export class Client extends BaseClient {
  constructor(uuid, options) {
    super(uuid);
    this._options = options;
    this._heartbeatTimer = null;
    this._connectionTimer = null;
  }

  _setSocket(socket) {
    super._setSocket(socket);
    this._resetHeartbeatTimeout();
    this._stopConnectionTimeout();
  }

  _closeSocket() {
    if (this._socket) {
      super._closeSocket();
      this._stopHeartbeatTimeout();
      this._startConnectionTimeout();
    }
  }

  _parse(...args) {
    super._parse(...args);
    this._resetHeartbeatTimeout();
  }

  _send(data, cb) {
    this._socket.send(data, cb);
  }

  _resetHeartbeatTimeout() {
    this._stopHeartbeatTimeout();
    this._heartbeatTimer = setTimeout(() => {
      this._closeSocket();
    }, this._options.heartbeatInterval + this._options.heartbeatTimeout);
  }

  _stopHeartbeatTimeout() {
    if (this._heartbeatTimer) {
      clearTimeout(this._heartbeatTimer);
    }
  }

  _startConnectionTimeout() {
    this._stopConnectionTimeout();
    this._connectionTimer = setTimeout(() => {
      this.close('timeout');
    }, this._options.connectionTimeout);
  }

  _stopConnectionTimeout() {
    if (this._connectionTimer) {
      clearTimeout(this._connectionTimer);
    }
  }
}
