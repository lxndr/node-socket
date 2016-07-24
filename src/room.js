import {Evented} from './evented';

export class Room extends Evented {
  constructor(socket, name = null) {
    super();
    this.socket = socket;
    this.name = name;
  }

  send(data) {
    return this.emit(null, data);
  }

  emit(event, data) {
    return this.socket._emit(this.name, event, data);
  }

  close() {
    this.removeAllListeners();
  }
}

export class FakeRoom extends Room {
  constructor(...args) {
    super(...args);
    console.log('Attempt to enter room', this.name, 'which does not exist');
  }

  emit() {}
}
