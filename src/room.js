import _ from 'lodash';
import {callback} from './util';

export class Room {
  constructor(socket, name = null) {
    this._events = new Map();
    this.socket = socket;
    this.name = name;
  }

  addListener(event, cb) {
    let listeners = this._events.get(event);

    if (!listeners) {
      listeners = [];
      this._events.set(event, listeners);
    }

    if (!listeners.includes(cb)) {
      listeners.push(cb);
    }

    return this;
  }

  removeListener(event, cb) {
    const listeners = this._events.get(event);
    if (listeners) {
      _.pull(listeners, cb);
      if (listeners.length === 0) {
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
  }

  on(event, cb) {
    return this.addListener(event, cb);
  }

  emit(event, data) {
    return this.socket._emit(this.name, event, data);
  }

  dispatch(event, data) {
    return Promise
      .all(
        this._events.get(event)
          .map(listener => listener(data))
      )
      .then(
        results => _.first(results)
      );
  }
}

export class FakeRoom extends Room {
  constructor(...args) {
    super(...args);
    console.log('Attempt to enter room', this.name, 'which does not exist');
  }

  on() {}
  emit() {}
  dispatch() {}
}
