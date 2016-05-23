Protocol:
  Client events:
    connect
    disconnect
    close
    join
    leave

[0] - acknowlegment
[1, 'data']   - user data
[3, 'room']   - join room
[4, 'room']   - leave room
[5, ping]     -
