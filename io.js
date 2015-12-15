
//*****************************************************
//******************** Game Server ********************
//*****************************************************

var io = require('socket.io')();
var players = [];
var sockets = {};
var speed = 10;
var mod = 0.5;

// Socket Stuff

io.on('connection', function(socket) {
	console.log('Client connected to socket.io!');

  var currentPlayer = {
    id: socket.id,
    planeX: 2500,
    planeY: 2500,
    angle: 0
  }

  socket.on('respawn', function(player) {
    if (!sockets[player.id]) {
      sockets[player.id] = socket;
      console.log(player.name, player.id);

      player.planeX = 2500;
      player.planeY = 2500;
      player.angle = 0;

      currentPlayer = player;

      players.push(currentPlayer);

      var playerSettings = player;

      socket.emit('joinGame', playerSettings);
    }
    console.log(players);
  });

  socket.on('leftPressed', function(player) {
    currentPlayer.angle -= 5;
    socket.emit('angleChange', currentPlayer);
  });

  socket.on('rightPressed', function(player) {
    currentPlayer.angle += 5;
    socket.emit('angleChange', currentPlayer);
    console.log(players);
  });
});

function movePlane() {
  players.forEach(function(player) {
    var newPlaneX = player.planeX + (speed * mod) * Math.sin(Math.PI / 180 * player.angle);
    var newPlaneY = player.planeY + -(speed * mod) * Math.cos(Math.PI / 180 * player.angle);

    if (newPlaneX >= 0 && newPlaneX <= 5000) {
      player.planeX = newPlaneX;
    }
    if (newPlaneY >= 0 && newPlaneY <= 5000) {
      player.planeY = newPlaneY;
    }
  });
};

setInterval(movePlane, 1000/60);  

module.exports = io;
