import _ from 'lodash';
import {Interval} from '../util';

export default superclass => class HeartbeatMixin extends superclass {
  constructor(...args) {
    super(...args);

    _.defaults(this._options, {
      heartbeatInterval: 15000
    });

    this._heartbeatTimer = new Interval(this._options.heartbeatInterval, () => {
      this._ping();
    });
  }

  _onconnect(...args) {
    super._onconnect(...args);
    this._heartbeatTimer.start();
  }

  _ondisconnect(...args) {
    this._heartbeatTimer.stop();
    super._ondisconnect(...args);
  }

  _send(...args) {
    this._heartbeatTimer.reset();
    super._send(...args);
  }
};
