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

  _ondisconnect(...args) {
    super._ondisconnect(...args);
    this._startConnectionTimeout();
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
    }
  }
};
