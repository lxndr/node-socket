Protocol:
  Client events:
    connect
    disconnect
    close
    join
    leave

[0, id] - acknowlegment
[1, uuid] - connect
[2, id, room, name, payload] - user data
[3] - ping
[4] - pong
[5, id, room] - join room
[6, id, room] - leave room
