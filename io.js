var io = require('socket.io')();

var angle = 0;
var sockets = {};
var users = [];

var planeX = 2500;
var planeY = 2500;
var speed = 20;
var mod = 0.5;

// Socket Stuff

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
    console.log(angle);
    io.emit('angleChange', angle);
  });

  socket.on('rightPressed', function() {
    angle += 5;
    console.log(angle);
    io.emit('angleChange', angle);
  });

  socket.on('respawn', function(player) {
    if (!sockets[player.id]) {
      sockets[player.id] = socket;
      console.log(player.name, player.id);
      socket.emit('startGame');
    }
    console.log(sockets);
  });

});

module.exports = io;
