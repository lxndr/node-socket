import SocketServer from '../src/server';

const socketServer = new SocketServer();
const data = {data: [1, 2, 3]};

socketServer.of('ns').in('room01').emit('event', data).then(response => {
  console.log(response);
}, err => {
  console.error(err.message);
});

const server = null;
const client = null;

server.emit(data);

server.of('ns').emit(data);

server.of('ns').in('room').emit(data);

client.emit(data);

client.in('room').emit(data);
