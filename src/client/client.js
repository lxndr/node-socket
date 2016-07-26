import _ from 'lodash';
import Url from 'url';
import UUID from 'uuid';
import {BaseClient} from '../base-client';
import {log, Interval} from '../util';

/**
 * Browser client.
 */
export class SocketClient extends BaseClient {
  constructor(url, options = {}) {
    super(UUID.v4());
    this.url = url;

    this.reconnectCooldown = options.reconnectCooldown || 5000;
    this.heartbeatInterval = options.heartbeatInterval || 15000;

    this._heartbeatSent = false;
    this._heartbeatTimer = new Interval(this.heartbeatInterval, () => {
      if (this._heartbeatSent) {
        this._closeSocket();
        return;
      }

      this._ping();
    });

    this.on('disconnect', _.bindKey(this, '_enqueueReconnect'));
    this.on('error', _.bindKey(this, '_enqueueReconnect'));
    this.on('pong', () => {
      this._heartbeatSent = false;
    });

    this._connect();
  }

  _connect() {
    if (this._closed) {
      return;
    }

    this._closeSocket();
    const socket = new WebSocket(this._formatUrl());
    log(`created anew`);

    socket.onopen = () => {
      this._setSocket(socket);
      this._heartbeatTimer.start();
    };

    socket.onerror = () => {
      log(`errored during connection`);
      this.in().dispatchEvent('error');
    };
  }

  _enqueueReconnect() {
    if (this._closed) {
      return;
    }

    setTimeout(() => {
      this._connect();
    }, this.reconnectCooldown);
  }

  _closeSocket() {
    this._heartbeatTimer.stop();
    super._closeSocket();
  }

  async join(room) {
    await this.emit('join', room);
    return this._ensureRoom(room);
  }

  async leave(room) {
    await this.emit('leave', room);
    await this._removeRoom(room);
  }

  _formatUrl() {
    const urlObject = _(Url.parse(this.url))
      .pick(['hostname', 'port', 'pathname'])
      .omitBy(_.isNil)
      .defaults({
        protocol: location.protocol === 'https:' ? 'wss' : 'ws',
        slashes: true,
        hostname: location.hostname,
        port: location.port,
        query: {
          uuid: this.uuid
        }
      })
      .value();

    return Url.format(urlObject);
  }

  _ping() {
    super._ping();
    this._heartbeatSent = true;
  }

  _enqueue(type, id, data, deferred) {
    if (deferred) {
      this._heartbeatSent = true;
      this._heartbeatTimer.reset();

      const packet = super._enqueue(type, id, data, deferred);

      packet.deferred.promise.then(arg => {
        this._heartbeatSent = false;
        return arg;
      });

      return packet;
    }

    return super._enqueue(type, id, data, deferred);
  }

  _send(data, cb) {
    this._socket.send(data);
    cb(null);
  }
}
