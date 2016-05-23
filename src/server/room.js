import _ from 'lodash';

export class Room {
  constructor(namespace, name) {
    this.namespace = namespace;
    this.name = name;
  }

  emit(...args) {
    return Promise.all(
      this.namespace.clients.filter(client => {
        return _.isEqual(client.room, this);
      }).map(client => client.emit(...args))
    );
  }
}
