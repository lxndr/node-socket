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

    listeners.add(callback(this, cb));
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

  once(event, cb) {
    return this.addListener(event, (...args) => {
      this.removeListener(event, cb);
      return cb(...args);
    });
  }

  async dispatchEvent(event, data) {
    const listeners = this._events.get(event);

    if (listeners) {
      const promises = Array.from(listeners).map(listener => listener(data));
      const results = await Promise.all(promises);
      return _.first(results);
    }
  }
}
