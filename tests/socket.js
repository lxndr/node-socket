const http = require('http');
const {ServerSocket} = require('../lib/server/server');

const httpServer = http.createServer().listen(55000);
let socketServer = null;
let ns = null;

describe('Socket', () => {
  it('should create server socket', () => {
    socketServer = new ServerSocket(httpServer);
  });

  it('should create default namespace', () => {
    ns = socketServer.of();
    expect(ns).to.exist;
    expect(ns.name).to.be.null;
  });

  it('should setup itself', () => {
    ns.on('connect', client => {
      expect(client).to.exist;
    });
  });

  it('should prospone closure if in the middle of callback', () => {
    client.on('reboot', () => {
      client.close();
    });
  });
});
