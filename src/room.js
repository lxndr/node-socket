import {Evented} from './evented';

export class Room extends Evented {
  constructor(socket, name = null) {
    super();
    this.socket = socket;
    this.name = name;
  }

  emit(event, data) {
    return this.socket._emit(this.name, event, data);
  }
}

export class FakeRoom extends Room {
  constructor(...args) {
    super(...args);
    console.log('Attempt to enter room', this.name, 'which does not exist');
  }

  emit() {}
}
