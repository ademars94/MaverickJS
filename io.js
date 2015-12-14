var io = require('socket.io')();

var angle = 0;
var sockets = {};

io.on('connection', function(socket) {
	console.log('Client connected to socket.io!');

  function keypress_handler(event) {
    console.log(event.keyCode);
    if (event.keyCode == 65) {
        angle -= 5;
    }
    if (event.keyCode == 68) {
        angle += 5;
    }
  }

  socket.on('leftPressed', function() {
    angle -= 5;
    io.emit('angleChange', angle);
  });

  socket.on('rightPressed', function() {
    angle += 5;
    console.log(angle);
  });

  socket.on('respawn', function(player) {
    if (!sockets[player.id]) {
      sockets[player.id] = socket;
      console.log(player.name);
    }
    console.log(sockets);
  });

});

module.exports = io;
