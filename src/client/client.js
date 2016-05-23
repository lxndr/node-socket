/* global WebSocket */

import _ from 'lodash';
import json5 from 'json5';
import {Evented} from '../evented.js';

/**
 * Browser client.
 * @class Client
 * @memberof client
 */
export class Client extends Evented {
  constructor(url, options) {
    super();
    this.url = url;
    this.rooms = new Set();
    this.ws = null;

    this.options = options;
    _.defaults(this.options, {
      timeout: 10000,
      reconnectCooldown: 2500
    });
  }

  connect() {
    this.scoket = new WebSocket(this.url);

    this.socket.onopen = () => {
      super.emit('connect');
    }

    this.socket.onclose = event => {
      super.emit('disconnect');

      setTimeout(() => {
        this.connect();
      }, this.options.reconnectCooldown);
    }

    this.socket.onmessage = data => {
      input = json5.parse(input);

      if (!_.isArray(input)) {
        return;
      }

      const [room, name, data] = input;
      this.emit(name, data);
    }
  }

  to(room) {

  }

  async join(room) {
    await this.emit('join', room);
    this.rooms.add(room);
  }

  async leave(room) {
    await this.emit('leave', room);
    this.rooms.delete(room);
  }

  emit(name, data) {
    return new Promise((resolve, reject) => {
      this.ws.send(data);
    });
  }
}
