import {CLOSE_TIMEOUT} from '../base-client';

const defaultHeartbeatInterval = 15000;
const defaultHeartbeatTimeout = 10000;

export default superclass => class HeartbeatTimeoutMixin extends superclass {
  constructor(...args) {
    super(...args);
    this._heartbeatTimeoutId = null;

    if (!this._options.heartbeatInterval) {
      this._options.heartbeatInterval = defaultHeartbeatInterval;
    }

    if (!this._options.heartbeatTimeout) {
      this._options.heartbeatTimeout = defaultHeartbeatTimeout;
    }
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
