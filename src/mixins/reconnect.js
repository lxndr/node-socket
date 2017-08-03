import _ from 'lodash';

export default superclass => class ReconnectMixin extends superclass {
  constructor(...args) {
    super(...args);
    this._enqueuedReconnectTimer = null;

    _.defaults(this._options, {
      reconnectCooldown: 5000,
      alwaysReconnect: true
    });
  }

  _ondisconnect(...args) {
    super._ondisconnect(...args);
    this._enqueueReconnect();
  }

  close() {
    if (this._options.alwaysReconnect) {
      this._enqueueReconnect();
    } else {
      super.close();
    }
  }

  _onerror(...args) {
    super._onerror(...args);
    this._enqueueReconnect();
  }

  _enqueueReconnect() {
    if (this._closed || this._enqueuedReconnectTimer) {
      return;
    }

    this._enqueuedReconnectTimer = setTimeout(() => {
      this._enqueuedReconnectTimer = null;
      this._connect();
    }, this._options.reconnectCooldown);
  }
};
