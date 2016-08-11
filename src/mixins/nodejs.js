export default superclass => class NodejsMixin extends superclass {
  _send(data, cb) {
    super._send(data, cb);
    this._socket.send(data, cb);
  }
};
