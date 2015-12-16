
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
// *************************** Move Logic *****************************
// ********************************************************************

var Player = function(name, id, planeX, planeY, angle) {
  this.name = name;
  this.id = id;
  this.planeX = planeX;
  this.planeY = planeY;
  this.angle = angle;
};

var Bullet = function(x, y, playerId, speed, angle) {
  this.x = x;
  this.y = y;
  this.playerId = playerId;
  this.speed = speed;
  this.angle = angle;
};

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

    if (newPlaneX >= 0 && newPlaneX <= 2560) {
      player.planeX = newPlaneX;
    }
    if (newPlaneY >= 0 && newPlaneY <= 2560) {
      player.planeY = newPlaneY;
    }
    sockets[player.id].emit('movePlane', player);
  });
};

setInterval(movePlane, 1000/60);
setInterval(updateAllPlayers, 1000/30);
// setInterval(logThatShit, 5000);

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

io.on('connection', function(socket) {
	console.log('Client connected to socket.io!');

  // Initialize the new player
  var currentPlayer;

  socket.on('respawn', function(newPlayer) {
    if (!sockets[newPlayer.id]) {
      sockets[newPlayer.id] = socket;
      console.log(newPlayer);

      currentPlayer = new Player(newPlayer.name, socket.id, 1280, 1280, 0)
      var playerSettings = currentPlayer;
      players.push(currentPlayer);

      socket.emit('joinGame', playerSettings);
    }
    console.log(players);
  });

  socket.on('leftPressed', function(player) {
    currentPlayer.angle -= 7;
  });

  socket.on('rightPressed', function(player) {
    currentPlayer.angle += 7;
  });

  socket.on('shiftPressed', function(player) {
    console.log(player.name, 'is firing!');
    io.emit('shotFired', currentPlayer);
  })

  socket.on('disconnect', function(player) {
    console.log(socket.id);
    players = players.filter(function(p) {
      return p.id !== socket.id;
    });
  });
});

module.exports = io;
