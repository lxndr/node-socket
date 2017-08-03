const http = require('http');
const {ServerSocket} = require('../lib/server/server');

const httpServer = http.createServer().listen(55000);
let serverSocket = null;

describe('Socket', () => {
  it('should create server socket', () => {
    serverSocket = new ServerSocket(httpServer);
  });

  it('should setup itself', () => {
    serverSocket.on('connect', client => {
      expect(client).to.exist;
    });
  });
});
