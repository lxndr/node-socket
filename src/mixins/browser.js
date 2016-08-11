import Url from 'url';
import _ from 'lodash';
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
    log(`[${this.uuid}] created anew`);

    socket.onopen = () => {
      this._onconnect(socket);
    };

    socket.onerror = () => {
      this._onerror(new Error('handshake failed'));
    };
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

  _send(data, cb) {
    super._send(data, cb);
    this._socket.send(data);
    cb(null);
  }
};
