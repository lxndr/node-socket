import ws from 'ws';
import {Client} from './client';
import {Room} from './room';

/**
 * @class Namespace
 */
export class Namespace {
  constructor(manager, name) {
    this.manager = manager;
    this.name = name;
    this.socket = new ws.Server(name);

    this.socket.on('connection', socket => {
      const client = new Client(socket);
      this.clients.push(client);
    });
  }

  /**
   * @see Manager#emit
   */
  emit(...args) {
    return Promise.all(
      this.clients.map(client => client.emit(...args))
    );
  }

  in(name) {
    return new Room(this, name);
  }
}
