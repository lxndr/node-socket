import {CLOSE_TIMEOUT} from '../base-client';

const defaultConnectionTimeout = 30000;

export default superclass => class ConnectionTimeoutMixin extends superclass {
  constructor(...args) {
    super(...args);
    this._connectionTimeoutId = null;

    if (!this._options.connectionTimeout) {
      this._options.connectionTimeout = defaultConnectionTimeout;
    }
  }

  _onconnect(...args) {
    super._onconnect(...args);
    this._stopConnectionTimeout();
  }

  _ondisconnect(code, reason) {
    super._ondisconnect(code, reason);

    if (code > 1001) {
      this._startConnectionTimeout();
    }
  }

  _onclose() {
    super._onclose();
    this._stopConnectionTimeout();
  }

  _startConnectionTimeout() {
    this._stopConnectionTimeout();
    this._connectionTimeoutId = setTimeout(() => {
      this.close(CLOSE_TIMEOUT, 'connection timeout');
    }, this._options.connectionTimeout);
  }

  _stopConnectionTimeout() {
    if (this._connectionTimeoutId) {
      clearTimeout(this._connectionTimeoutId);
      this._connectionTimeoutId = null;
    }
  }
};
