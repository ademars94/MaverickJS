
// ********************************************************************
// *************************** Game Server ****************************
// ********************************************************************

// Global Variables

var io = require('socket.io')();
var players = [];
var sockets = {};
var speed = 10;
var mod = 0.5;

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

io.on('connection', function(socket) {
	console.log('Client connected to socket.io!');

  // Initialize the new player
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

      var playerSettings = player;
      currentPlayer = player;
      players.push(currentPlayer);

      socket.emit('joinGame', playerSettings);
    }
    console.log(players);
  });

  // Event Listeners
  socket.on('leftPressed', function(player) {
    currentPlayer.angle -= 5;
  });
  socket.on('rightPressed', function(player) {
    currentPlayer.angle += 5;
  });
});

// ********************************************************************
// *************************** Move Logic *****************************
// ********************************************************************

function updateAllPlayers() {
  if (players.length > 0) {
    io.emit('updateAllPlayers', players);
  };
}

function logThatShit() {
  console.log(players);
}

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
    sockets[player.id].emit('movePlane', player);
  });
};

setInterval(movePlane, 1000/60);
setInterval(updateAllPlayers, 1000/30);
setInterval(logThatShit, 1000);


module.exports = io;
