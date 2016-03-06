
// ********************************************************************
// *************************** Game Server ****************************
// ********************************************************************

// Global Variables

var io = require('socket.io')();
var players = [];
var bulletData = [];
var leaderboard = [];
var sockets = {};
// var speed = 10;
var mod = 1;
var bulletId = 0;

// setInterval(logThatShit, 3000);

// ********************************************************************
// *************************** Move Logic *****************************
// ********************************************************************

var Player = function(name, plane, id, x, y, speed, angle, health, points) {
  this.name = name;
  this.plane = plane;
  this.id = id;
  this.x = x;
  this.y = y;
  this.speed = speed;
  this.angle = angle;
  this.health = health;
  this.points = points;
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
  io.emit('updateAllPlayers', players);
}

function updateLeaderboard() {
  if (players.length > 0) {
    leaderboard = players.slice(0);
  }
  leaderboard.sort( function(a, b) {return b.points - a.points} );
  if (leaderboard.length > 5) {
    leaderboard.splice(6, leaderboard.length);
  }
  io.emit('updateAllLeaderboards', leaderboard);
};

function movePlane() {
  players.forEach(function(player) {
    var newPlaneX = player.x + (player.speed * mod) * Math.sin(Math.PI / 180 * player.angle);
    var newPlaneY = player.y - (player.speed * mod) * Math.cos(Math.PI / 180 * player.angle);

    // if (player.health < 1) {
    //   io.emit('playerDie', player)
    //   players = players.filter(function(p) {
    //     return p.id !== player.id;
    //   });
    // }

    if (newPlaneX >= 0 && newPlaneX <= 5000) {
      player.x = newPlaneX;
    }
    if (newPlaneY >= 0 && newPlaneY <= 5000) {
      player.y = newPlaneY;
    }
    sockets[player.id].emit('movePlane', player);
  });
};

function moveBullets() {
  bulletData.forEach(function(bullet) {
    var newBulletX = bullet.x + (bullet.speed * mod) * Math.sin(Math.PI / 180 * bullet.angle);
    var newBulletY = bullet.y -(bullet.speed * mod) * Math.cos(Math.PI / 180 * bullet.angle);
    if (newBulletX >= 0 && newBulletX <= 5000) {
      bullet.x = newBulletX;
    }
    else {
      bulletData = bulletData.filter(function(b) {
        return bullet.id !== b.id;
      });
    }
    if (newBulletY >= 0 && newBulletY <= 5000) {
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
      && b.x > p.x - 32
      && b.x < p.x + 32
      && b.y > p.y - 32
      && b.y < p.y + 32) {
        p.health --;
        bulletData = bulletData.filter(function(bullet) {
          return bullet.id !== b.id;
        });
        if (p.health < 1) {
          io.emit('playerDie', p)
          players = players.filter(function(p2) {
            return p2.id !== p.id;
          });

          players.forEach(function(attacker) {
            if (b.playerId === attacker.id) {
              attacker.points += 1;
            }
          });
        }
      }
    });
  });
}

function logger() {
  console.log("Players:", players)
}

setInterval(movePlane, 1000/30);
setInterval(moveBullets, 1000/30);
setInterval(checkCollisions, 1000/30);
setInterval(updateAllPlayers, 1000/30);
setInterval(updateLeaderboard, 1000);
// setInterval(logger, 1000);

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

io.on('connection', function(socket) {
	console.log('Client connected to socket.io!');

  // Initialize the new player
  var currentPlayer;

  // Creates new players with constructor
  socket.on('spawn', function(client) {
    if (!sockets[client.id]) {
      sockets[client.id] = socket;
      console.log('Player joined:', client);
      currentPlayer = new Player(
        client.name,
        client.plane,
        socket.id,
        2500,
        2500,
        12,// Speed
        0,
        10,
        0
      );
      players.push(currentPlayer);

      var updatedSettings = currentPlayer;
      socket.emit('joinGame', updatedSettings);
    }
  });

  socket.on('respawn', function(client) {
    // Reinitialize the current player
    currentPlayer.health = 10;
    currentPlayer.points = 0;
    currentPlayer.x      = 2500;
    currentPlayer.y      = 2500;
    currentPlayer.angle  = 0;
    currentPlayer.speed  = 12;

    players.push(currentPlayer);

    var updatedSettings = currentPlayer;
    socket.emit('rejoinGame', updatedSettings);
  })

  socket.on('leftPressed', function(player) {
    if (player.speed > 17) {
      currentPlayer.angle -= 3;
    }
    else if (player.speed > 13) {
      currentPlayer.angle -= 4;
    }
    else {
      currentPlayer.angle -= 5;
    }
  });

  socket.on('rightPressed', function(player) {
    if (player.speed > 17) {
      currentPlayer.angle += 3;
    }
    else if (player.speed > 13) {
      currentPlayer.angle += 4;
    }
    else {
      currentPlayer.angle += 5;
    }
  });

  // Creates new bulletData with constructor on shift press
  socket.on('shiftPressed', function(player) {
    if (player.health > 1) {
      bulletId += 1;
      var bullet = new Bullet(
        currentPlayer.x,
        currentPlayer.y,
        bulletId,
        player.id,
        50,
        currentPlayer.angle
      );
      bulletData.push(bullet);
      io.emit('shotFired', currentPlayer);
    }
  });

  socket.on('upPressed', function(player) {
    if (currentPlayer.speed <= 20) currentPlayer.speed += 0.25;
  });

  socket.on('downPressed', function(player) {
    if (currentPlayer.speed >= 12) currentPlayer.speed -= 0.25;
  });

  socket.on('disconnect', function(player) {
    console.log('Socket with this id disconnected:', socket.id);
    players = players.filter(function(p) {
      return p.id !== socket.id;
    });
  });
});

module.exports = io;
