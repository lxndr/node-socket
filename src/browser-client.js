import UUID from 'uuid';
import {mix} from 'mixwith';
import BaseClient from './base-client';
import BrowserMixin from './mixins/browser';
import HeartbeatMixin from './mixins/heartbeat';
import HeartbeatTimeoutMixin from './mixins/heartbeat-timeout';
import ReconnectMixin from './mixins/reconnect';

/**
 * Browser client.
 */
export class SocketClient extends mix(BaseClient).with(BrowserMixin, HeartbeatMixin, HeartbeatTimeoutMixin, ReconnectMixin) {
  constructor(url, options = {}) {
    super(UUID.v4(), options);
    this.url = url;
    this._connect();
  }

  async join(room) {
    await this.emit('join', room);
    return this._ensureRoom(room);
  }

  async leave(room) {
    await this.emit('leave', room);
    this._removeRoom(room);
  }
}
