/* eslint-env browser */

import Url from 'url';
import {CLOSE_REPLACED} from '../base-client';
import {log} from '../util';

export default superclass => class BrowserMixin extends superclass {
  _connect() {
    if (this._closed) {
      return;
    }

    this._disconnect(CLOSE_REPLACED);

    const url = this._formatUrl();
    const socket = new WebSocket(url);
    log(`[${this.id}] created anew`);

    socket.onopen = () => {
      this._onconnect(socket);
    };

    socket.onerror = () => {
      this._onerror(new Error('handshake failed'));
    };
  }

  _formatUrl() {
    const {hostname, port, pathname, query} = Url.parse(this.url, true);

    const urlObject = {
      protocol: location.protocol === 'https:' ? 'wss' : 'ws',
      slashes: true,
      hostname: hostname || location.hostname,
      port: port || location.port,
      pathname,
      query: {
        ...query,
        id: this.id
      }
    };

    return Url.format(urlObject);
  }

  _send(data, cb) {
    super._send(data, cb);
    this._socket.send(data);
    cb(null);
  }
};
