import _ from 'lodash';
import {CLOSE_TIMEOUT} from '../base-client';

export default superclass => class ConnectionTimeoutMixin extends superclass {
  constructor(...args) {
    super(...args);
    this._connectionTimeoutId = null;

    _.defaults(this._options, {
      connectionTimeout: 30000
    });
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
