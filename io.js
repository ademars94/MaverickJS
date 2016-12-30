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

var Player = function(name, plane, id, x, y, speed, angle, health, points, ammo, homingMissiles, missiles) {
  this.name           = name;
  this.plane          = plane;
  this.id             = id;
  this.x              = x;
  this.y              = y;
  this.speed          = speed;
  this.angle          = angle;
};

// ********************************************************************
// *************************** Move Logic *****************************
// ********************************************************************

function tick() {
  movePlayers()
}

function updateGameState() {
  if (players.length > 0) {
    console.log(players)
  }
  io.emit('updateGameState', players)
}

setInterval(tick, 1000/60)
setInterval(updateGameState, 1000/20)

function movePlayers() {
  players.forEach(function(player) {
    var dx = player.x - (player.speed) * Math.sin(Math.PI / 180 * player.angle)
    var dy = player.y + (player.speed) * Math.cos(Math.PI / 180 * player.angle)

    if (dx >= -2048 && dx <= 2048) {
      player.x = dx
    }
    if (dy >= -2048 && dy <= 2048) {
      player.y = dy
    }
  })
}

function playerJoined(player) {
  io.emit('playerJoined', player)
}

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

io.on('connection', function(socket) {
	console.log('Client connected to socket.io!');

  socket.on('spawn', function(client) {
    console.log("Spawning: ", client)

    if (!sockets[client.id]) {
      sockets[client.id] = socket;

      var player = new Player(
        client.name || "Player",
        client.plane,
        client.id,
        client.x,
        client.y,
        client.speed,
        client.angle
      );

      players.push(player);
      playerJoined(player)
    }
  });

  socket.on('changeAngle', function(client) {
    players.forEach(function(player) {
      if (player.id == client.id) {
        player.angle = client.angle
      }
    })
  })

  // socket.on('planeMoved', function(client) {

  // })

  socket.on('disconnect', function(client) {
    console.log('Socket with this id disconnected:', socket.id);
    players = players.filter(function(p) {
      return p.id !== socket.id;
    });
  });
});

module.exports = io;
