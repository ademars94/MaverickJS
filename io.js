
// ********************************************************************
// *************************** Game Server ****************************
// ********************************************************************

// Global Variables

var io = require('socket.io')();
var players = [];
var bulletData = [];
var sockets = {};
var speed = 10;
var mod = 0.5;
var bulletId = 0;

// ********************************************************************
// *************************** Move Logic *****************************
// ********************************************************************

var Player = function(name, id, planeX, planeY, angle, health) {
  this.name = name;
  this.id = id;
  this.planeX = planeX;
  this.planeY = planeY;
  this.angle = angle;
  this.health = health;
};

var Bullet = function(x, y, id, playerId, speed, angle) {
  this.x = x;
  this.y = y;
  this.id = id;
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
    var newPlaneY = player.planeY -(speed * mod) * Math.cos(Math.PI / 180 * player.angle);

    if (newPlaneX >= 0 && newPlaneX <= 2560) {
      player.planeX = newPlaneX;
    }
    if (newPlaneY >= 0 && newPlaneY <= 2560) {
      player.planeY = newPlaneY;
    }
    sockets[player.id].emit('movePlane', player);
  });
};

function moveBullets() {
  bulletData.forEach(function(bullet) {
    var newBulletX = bullet.x + (bullet.speed * mod) * Math.sin(Math.PI / 180 * bullet.angle);
    var newBulletY = bullet.y -(bullet.speed * mod) * Math.cos(Math.PI / 180 * bullet.angle);
    if (newBulletX >= 10 && newBulletX <= 2550) {
      bullet.x = newBulletX;
      // console.log(Math.floor(bullet.x), Math.floor(bullet.y));
    }
    else {
      bulletData = bulletData.filter(function(b) {
        return bullet.id !== b.id;
      });
    }
    if (newBulletY >= 10 && newBulletY <= 2550) {
      bullet.y = newBulletY;
    }
    else {
      bulletData = bulletData.filter(function(b) {
        return bullet.id !== b.id;
      });
    }
  });
  io.emit('moveBullets', bulletData);
}

function checkCollisions() {
  bulletData.forEach(function(b) {
    players.forEach(function(p) {
      if (b.playerId !== p.id
      && b.x > p.planeX - 32
      && b.x < p.planeX + 32
      && b.y > p.planeY - 32
      && b.y < p.planeY + 32) {
        io.emit('playerHit', p);
        p.health --;
        bulletData = bulletData.filter(function(bullet) {
          return bullet.id !== b.id;
        });
        if (p.health < 1) {
          io.emit('playerDie', p)
          players = players.filter(function(p2) {
            return p2.id !== p.id;
          });
        }
      }
    });
  });
}

setInterval(movePlane, 1000/60);
setInterval(moveBullets, 1000/60);
setInterval(checkCollisions, 1000/60);
setInterval(updateAllPlayers, 1000/60);
// setInterval(logThatShit, 5000);

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

io.on('connection', function(socket) {
	console.log('Client connected to socket.io!');

  // Initialize the new player
  var currentPlayer;

  // Creates new players with constructor
  socket.on('respawn', function(newPlayer) {
    if (!sockets[newPlayer.id]) {
      sockets[newPlayer.id] = socket;
      console.log(newPlayer);

      currentPlayer = new Player(newPlayer.name, socket.id, 1280, 1280, 0, 1);
      players.push(currentPlayer);

      var playerSettings = currentPlayer;
      socket.emit('joinGame', playerSettings);
    }
    console.log(players);
  });

  // Creates new bulletData with constructor on shift press
  socket.on('shiftPressed', function(player) {
    console.log(player.name, 'is firing!');
    bulletId += 1;
    var bullet = new Bullet(
      currentPlayer.planeX,
      currentPlayer.planeY,
      bulletId,
      player.id,
      speed * 3,
      currentPlayer.angle
    );
    bulletData.push(bullet);
    io.emit('shotFired', currentPlayer);
  })

  socket.on('leftPressed', function(player) {
    currentPlayer.angle -= 10;
  });

  socket.on('rightPressed', function(player) {
    currentPlayer.angle += 10;
  });

  socket.on('disconnect', function(player) {
    console.log(socket.id);
    players = players.filter(function(p) {
      return p.id !== socket.id;
    });
  });
});

module.exports = io;
