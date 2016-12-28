// Copyright (C) Alex DeMars - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Written by Alex DeMars <alexdemars@gmail.com>, March, 2016

// ********************************************************************
// *************************** Game Server ****************************
// ********************************************************************

// Global Variables

var io = require('socket.io')();
var players              = [];
var sockets              = {};
var frames               = 0;

// ********************************************************************
// *************************** Move Logic *****************************
// ********************************************************************

var Player = function(name, plane, id, x, y, speed, angle, health, points, ammo, homingMissiles, missiles) {
  this.name           = name;
  this.plane          = plane;
  this.id             = id;
  this.x              = x;
  this.y              = y;
  this.speed          = speed;
  this.angle          = angle;
  this.health         = health;
  this.points         = points;
  this.ammo           = ammo;
  this.homingMissiles = homingMissiles;
  this.missiles       = missiles;
};

function updateAllPlayers() {
  io.emit('updateAllPlayers', players);
};

function movePlane() {
  players.forEach(function(player) {
    var newPlaneX = player.x + (player.speed) * Math.sin(Math.PI / 180 * player.angle);
    var newPlaneY = player.y - (player.speed) * Math.cos(Math.PI / 180 * player.angle);

    if (newPlaneX >= -2048 && newPlaneX <= 2048) {
      player.x = newPlaneX;
    }
    if (newPlaneY >= -2048 && newPlaneY <= 2048) {
      player.y = newPlaneY;
    }

    console.log("x: " + player.x + ", y: " + player.y)

    sockets[player.id].emit('movePlane', player);
  });
};

setInterval(movePlane, 1000/30);

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

io.on('connection', function(socket) {
	console.log('Client connected to socket.io!');

  // Initialize the new player
  var currentPlayer;

  // Creates new players with constructor
  socket.on('spawn', function(client) {
    console.log("Spawning: ", client)
    if (!sockets[client.id]) {
      sockets[client.id] = socket;
      currentPlayer = new Player(
        client.name,
        client.plane,
        socket.id,
        0, // X
        0, // Y
        12,   // Speed
        0,    // Angle
        20,   // Health
        0,    // Points
        10,   // Ammo
        0,    // Homing Missiles
        2     // Missiles
      );
      players.push(currentPlayer);

      var updatedSettings = currentPlayer;
      socket.emit('joinGame', updatedSettings);
    }
  });

  socket.on('respawn', function(client) {
    // Reinitialize the current player
    currentPlayer.health         = 20;
    currentPlayer.points         = 0;
    currentPlayer.x              = 2500;
    currentPlayer.y              = 2500;
    currentPlayer.angle          = 0;
    currentPlayer.speed          = 12;
    currentPlayer.ammo           = 10;
    currentPlayer.homingMissiles = 0;
    currentPlayer.missiles       = 2;

    players.push(currentPlayer);

    var updatedSettings = currentPlayer;
    socket.emit('rejoinGame', updatedSettings);
  })

  // Creates new homingMissiles with constructor on space press
  socket.on('spacePressed', function(player) {
    if (player.health >= 1 && player.ammo >=1) {
      currentPlayer.ammo --;
      if (currentPlayer.ammo < 1) {
        setTimeout(reloader, 3000);
      }
      bulletId += 1;
      var bullet = new Bullet(
        currentPlayer.x,
        currentPlayer.y,
        bulletId,
        player.id,
        60,
        currentPlayer.angle
      );
      bulletData.push(bullet);

      io.emit('shotFired', currentPlayer);
    }
  });

  socket.on('reload', function(player) {
    if (reloading === 1) {
      reloading = 2;
      setTimeout(function() {
        currentPlayer.ammo = 10;
        reloading = 1;
      }, 3000);
    }
  });

  socket.on('disconnect', function(player) {
    console.log('Socket with this id disconnected:', socket.id);
    players = players.filter(function(p) {
      return p.id !== socket.id;
    });
  });
});

module.exports = io;
