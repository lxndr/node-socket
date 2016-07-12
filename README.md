Protocol:
  Client events:
    connect
    reconnect
    disconnect
    close
    message
    join
    leave

Packet format:
  [0, id, payload] - acknowlegment
  [1] - ping
  [2, id, room, name, payload] - user data
