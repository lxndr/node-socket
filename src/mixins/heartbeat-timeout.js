import _ from 'lodash';
import {CLOSE_TIMEOUT} from '../base-client';

export default superclass => class HeartbeatTimeoutMixin extends superclass {
  constructor(...args) {
    super(...args);
    this._heartbeatTimeoutId = null;

    _.defaults(this._options, {
      heartbeatInterval: 15000,
      heartbeatTimeout: 10000
    });
  }

  _onconnect(...args) {
    super._onconnect(...args);
    this._resetHeartbeatTimeout();
  }

  _ondisconnect(...args) {
    super._ondisconnect(...args);
    this._stopHeartbeatTimeout();
  }

  _parse(...args) {
    super._parse(...args);
    this._resetHeartbeatTimeout();
  }

  _resetHeartbeatTimeout() {
    this._stopHeartbeatTimeout();
    this._heartbeatTimeoutId = setTimeout(() => {
      this._disconnect(CLOSE_TIMEOUT, 'heartbeat timeout');
    }, this._options.heartbeatInterval + this._options.heartbeatTimeout);
  }

  _stopHeartbeatTimeout() {
    if (this._heartbeatTimeoutId) {
      clearTimeout(this._heartbeatTimeoutId);
      this._heartbeatTimeoutId = null;
    }
  }
};
