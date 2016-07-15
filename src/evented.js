import _ from 'lodash';
import {callback} from './util';

export class Evented {
  constructor() {
    this._events = new Map();
  }

  addListener(event, cb) {
    let listeners = this._events.get(event);

    if (!listeners) {
      listeners = new Set();
      this._events.set(event, listeners);
    }

    listeners.add(callback(cb));
    return this;
  }

  removeListener(event, cb) {
    const listeners = this._events.get(event);
    if (listeners) {
      listeners.delete(cb);
      if (listeners.size === 0) {
        this._events.delete(event);
      }
    }

    return this;
  }

  removeAllListeners(event) {
    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }

    return this;
  }

  on(event, cb) {
    return this.addListener(event, cb);
  }

  dispatch(event, data) {
    return Promise
      .all(
        this._events.get(event)
          .entries()
          .map(listener => listener(data))
      )
      .then(
        results => _.first(results)
      );
  }
}
