[![license](https://img.shields.io/github/license/lxndr/node-socket.svg?style=flat)](https://tldrlegal.com/license/mit-license)
[![dependencies status](https://img.shields.io/david/lxndr/node-socket.svg?style=flat)](https://david-dm.org/lxndr/node-socket)
[![devDependencies status](https://img.shields.io/david/dev/lxndr/node-socket.svg?style=flat)](https://david-dm.org/lxndr/node-socket#info=devDependencies)

API

ServerSocket:

Methods:

Protocol:

  Client events:

    connect
    disconnect
    close
    message
    join
    leave

Packet format:
  - [0, id, payload] - acknowlegment
  - [1] - ping
  - [2] - pong
  - [3, id, room, name, payload] - user data
