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
var bulletData           = [];
var availableItems       = [];
var homingMissiles       = [];
var missiles             = [];
var leaderboard          = [];
var sockets              = {};
var bulletId             = 0;
var homingMissileId      = 0;
var missileId            = 0;
var healthPackId         = 0;
var availMissileId       = 100;
var availHomingMissileId = 200;
var frames               = 0;

// setInterval(logThatShit, 3000);

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

var Bullet = function(x, y, id, playerId, speed, angle) {
  this.x        = x;
  this.y        = y;
  this.id       = id;
  this.playerId = playerId;
  this.speed    = speed;
  this.angle    = angle;
};

var HomingMissile = function(x, y, id, playerId, trackingId, speed, angle) {
  this.x        = x;
  this.y        = y;
  this.id       = id;
  this.playerId = playerId;
  this.speed    = speed;
  this.angle    = angle;
};

var Missile = function(x, y, id, playerId, speed, angle) {
  this.x        = x;
  this.y        = y;
  this.id       = id;
  this.playerId = playerId;
  this.speed    = speed;
  this.angle    = angle;
};

var AvailHomingMissile = function(type, x, y, id) {
  this.type = type;
  this.x  = x;
  this.y  = y;
  this.id = id;
}

var AvailMissile = function(type, x, y, id) {
  this.type = type;
  this.x  = x;
  this.y  = y;
  this.id = id;
}

var HealthPack = function(type, x, y, id) {
  this.type = type;
  this.x  = x;
  this.y  = y;
  this.id = id;
};

function spotRandomizer() {
  return Math.floor(Math.random()*(4500-500+1)+500);
}

function spawnItems() {
  var healthPacks = 0;
  var missiles = 0;
  var homingMissiles = 0;

  availableItems.forEach(function(i) {
    if (i.type === 0) healthPacks++;
    if (i.type === 1) missiles++;
    if (i.type === 2) homingMissiles++;
  })

  if (healthPacks < 2) {
    spawnHealthPacks();
  }
  if (missiles < 2) {
    spawnMissiles();
  }
  if (homingMissiles < 2) {
    spawnHomingMissiles();
  }
  io.emit('updateItems', availableItems);
}

function spawnHealthPacks() {
  healthPackId += 1;
  var healthPack = new HealthPack(
    0, // Type
    spotRandomizer(), // X
    spotRandomizer(), // Y
    healthPackId // ID
  );
  availableItems.push(healthPack);
};

function spawnMissiles() {
  availMissileId += 1;
  var availMissile = new AvailMissile(
    1, // Type
    spotRandomizer(), // X
    spotRandomizer(), // Y
    availMissileId // ID
  );
  availableItems.push(availMissile);
};

function spawnHomingMissiles() {
  availHomingMissileId += 1;
  var availHomingMissile = new AvailHomingMissile(
    2, // Type
    spotRandomizer(), // X
    spotRandomizer(), // Y
    availHomingMissileId // ID
  );
  availableItems.push(availHomingMissile);
}

function updateAllPlayers() {
  io.emit('updateAllPlayers', players);
};

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
    var newPlaneX = player.x + (player.speed) * Math.sin(Math.PI / 180 * player.angle);
    var newPlaneY = player.y - (player.speed) * Math.cos(Math.PI / 180 * player.angle);

    if (newPlaneX >= 0 && newPlaneX <= 5000) {
      player.x = newPlaneX;
    }
    if (newPlaneY >= 0 && newPlaneY <= 5000) {
      player.y = newPlaneY;
    }
    if (player.name !== 'Computer') {
      sockets[player.id].emit('movePlane', player);
    }
  });
};

function moveBullets() {
  if (bulletData.length > 0) {
    bulletData.forEach(function(bullet) {
      var newBulletX = bullet.x + (bullet.speed) * Math.sin(Math.PI / 180 * bullet.angle);
      var newBulletY = bullet.y -(bullet.speed) * Math.cos(Math.PI / 180 * bullet.angle);
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
    // io.emit('moveBullets', bulletData);
  }
};

function moveMissiles() {
  if (missiles.length > 0) {
    missiles.forEach(function(missile) {
      var newMissileX = missile.x + (missile.speed) * Math.sin(Math.PI / 180 * missile.angle);
      var newMissileY = missile.y -(missile.speed) * Math.cos(Math.PI / 180 * missile.angle);
      if (newMissileX >= 0 && newMissileX <= 5000) {
        missile.x = newMissileX;
      }
      else {
        missiles = missiles.filter(function(m) {
          return missile.id !== m.id;
        });
      }
      if (newMissileY >= 0 && newMissileY <= 5000) {
        missile.y = newMissileY;
      }
      else {
        missiles = missiles.filter(function(m) {
          return missile.id !== m.id;
        });
      }
    });
  }
};

function moveHomingMissiles() {
  if (homingMissiles.length > 0) {
    homingMissiles.forEach(function(hm) {
      var newMissileX = hm.x + (hm.speed) * Math.sin(Math.PI / 180 * hm.angle);
      var newMissileY = hm.y -(hm.speed) * Math.cos(Math.PI / 180 * hm.angle);

      if (newMissileX >= 0 && newMissileX <= 5000) {
        hm.x = newMissileX;
      }
      else {
        homingMissiles = homingMissiles.filter(function(m) {
          return hm.id !== m.id;
        });
      }
      if (newMissileY >= 0 && newMissileY <= 5000) {
        hm.y = newMissileY;
      }
      else {
        homingMissiles = homingMissiles.filter(function(m) {
          return hm.id !== m.id;
        });
      }
    });
    // io.emit('moveHomingMissiles', homingMissiles);
  }
};

function controlHomingMissiles() {
  if (homingMissiles.length > 0) {
    var followX;
    var followY;
    var a, b, c;
    var dist = 10000;

    homingMissiles.forEach(function(hm) {
      players.forEach(function(player) {
        if (player.id !== hm.playerId) {

          a = player.x - hm.x;
          b = player.y - hm.y;
          c = Math.abs(Math.sqrt(a * a, b * b));

          if (c < dist) {
            followX = player.x;
            followY = player.y;
          }

          dist = c;
        }
      });

      var dy = followY - hm.y;
      var dx = followX - hm.x;
      var targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;

      if (hm.angle !== targetAngle) {
        var delta = targetAngle - hm.angle;

        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        if (delta > 0) {
          hm.angle += 3;
        }
        if (delta < 0) {
          hm.angle -= 3;
        }
        if (Math.abs(delta) < 3) {
          hm.angle = targetAngle;
        }
      }
    });
  }
};

function checkPlayerBulletCollision() {
  players.forEach(function(p) {
    bulletData.forEach(function(b) {
      if (b.playerId !== p.id
      && b.x > p.x - 48
      && b.x < p.x + 48
      && b.y > p.y - 48
      && b.y < p.y + 48) {
        p.health--;
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
};

function checkPlayerMissileCollision() {
  missiles.forEach(function(m) {
    players.forEach(function(p) {
      if (m.playerId !== p.id
      && m.x > p.x - 48
      && m.x < p.x + 48
      && m.y > p.y - 48
      && m.y < p.y + 48) {
        p.health-=6;
        missiles = missiles.filter(function(m2) {
          return m.id !== m2.id;
        });
        if (p.health < 1) {
          io.emit('playerDie', p)
          players = players.filter(function(p2) {
            return p2.id !== p.id;
          });
          players.forEach(function(attacker) {
            if (m.playerId === attacker.id) {
              attacker.points += 1;
            }
          });
        }
      }
    });
  });
};

function checkPlayerHomingMissileCollision() {
  players.forEach(function(p) {
    homingMissiles.forEach(function(hm) {
      if (hm.playerId !== p.id
      && hm.x > p.x - 48
      && hm.x < p.x + 48
      && hm.y > p.y - 48
      && hm.y < p.y + 48) {
        p.health-=6;
        homingMissiles = homingMissiles.filter(function(m) {
          return hm.id !== m.id;
        });
        if (p.health < 1) {
          io.emit('playerDie', p)
          players = players.filter(function(p2) {
            return p2.id !== p.id;
          });
          players.forEach(function(attacker) {
            if (hm.playerId === attacker.id) {
              attacker.points += 1;
            }
          });
        }
      }
    });
  });
};

function checkPlayerItemCollision() {
  players.forEach(function(p) {
    availableItems.forEach(function(i) {
      if (i.x > p.x - 48
      &&  i.x < p.x + 48
      &&  i.y > p.y - 48
      &&  i.y < p.y + 48) {
        if (i.type === 0 && p.health < 20) {
          if (p.health > 10) {
            p.health = p.health = 20;
          }
          else {
            p.health += 10;
          }
          availableItems = availableItems.filter(function(i2) {
            return i2.id !== i.id;
          });
        }
        if (i.type === 1) {
          p.missiles += 1;
          availableItems = availableItems.filter(function(i2) {
            return i2.id !== i.id;
          });
        }
        if (i.type === 2) {
          p.homingMissiles += 1;
          availableItems = availableItems.filter(function(i2) {
            return i2.id !== i.id;
          });
        }
        io.emit('updateItems', availableItems);
      }
    });
  });
}

function checkHomingMissileBulletCollision() {
  bulletData.forEach(function(b) {
    homingMissiles.forEach(function(hm) {
      if (b.playerId !== hm.playerId
      &&  b.x > hm.x - 36
      &&  b.x < hm.x + 36
      &&  b.y > hm.y - 36
      &&  b.y < hm.y + 36) {
        bulletData = bulletData.filter(function(bullet) {
          return bullet.id !== b.id;
        });
        homingMissiles = homingMissiles.filter(function(m) {
          return hm.id !== m.id;
        });
      }
    })
  });
}

function checkCollisions() {
  if (bulletData.length > 0) {
    checkPlayerBulletCollision();
  }

  if (bulletData.length > 0 && homingMissiles.length > 0) {
    checkHomingMissileBulletCollision();
  }

  if (availableItems.length > 0) {
    checkPlayerItemCollision();
  }

  if (homingMissiles.length > 0) {
    checkPlayerHomingMissileCollision();
  }

  if (missiles.length > 0) {
    checkPlayerMissileCollision();
  }

  io.emit('moveBullets', bulletData);
  io.emit('moveHomingMissiles', homingMissiles);
  io.emit('moveMissiles', missiles);
};

// function reloader() {
//   players.forEach(function(player) {
//     if (player.ammo < 1) {
//       setTimeout(function() {
//         player.ammo = 10;
//       }, 3000);
//     }
//   })
// }

function reloader() {
  players.forEach(function(player) {
    if (player.ammo < 1) {
      player.ammo = 10;
    }
  })
};

function spawnComputerPlayer() {
  var computerId = 0;
  computerId++;
  computerPlayer = new Player(
    'Computer',
    Math.floor(Math.random()*(4-0+1)+0),
    computerId,
    2500, // X
    2500, // Y
    12,   // Speed
    0,    // Angle
    10,   // Health
    0,    // Points
    10
  );
  players.push(computerPlayer);
};

function controlComputerPlayers() {
  var followAngle;
  var followX;
  var followY;

  players.forEach(function(player) {
    if (player.name !== 'Computer') {
      followAngle = player.angle;
      followX     = player.x;
      followY     = player.y;
    }

    if (player.name === 'Computer') {

      var dy = followY - player.y;
      var dx = followX - player.x;

      var targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;

      if (player.angle !== targetAngle) {
        var delta = targetAngle - player.angle;

        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        if (delta > 0) {
          player.angle += 5;
        }
        if (delta < 0) {
          player.angle -= 5;
        }
        if (Math.abs(delta) < 5) {
          player.angle = targetAngle;
        }
      }
    }
  })
};

setInterval(movePlane, 1000/30);
setInterval(moveBullets, 1000/30);
setInterval(moveMissiles, 1000/30);
setInterval(moveHomingMissiles, 1000/30);
setInterval(controlHomingMissiles, 1000/30);
setInterval(checkCollisions, 1000/30);
setInterval(updateAllPlayers, 1000/30);
setInterval(updateLeaderboard, 1000);
setInterval(controlComputerPlayers, 1000/30);
setInterval(spawnItems, 2000);
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
    console.log("Spawning: ", client)
    if (!sockets[client.id]) {
      sockets[client.id] = socket;
      currentPlayer = new Player(
        client.name,
        client.plane,
        socket.id,
        2500, // X
        2500, // Y
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

  socket.on('ping', function () {
    socket.emit('pong');
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

  socket.on('leftPressed', function(player) {
    if (player.speed > 17) {
      currentPlayer.angle -= 3;
      if (currentPlayer.angle <= -360) { currentPlayer.angle = 0; }
    }
    else if (player.speed > 13) {
      currentPlayer.angle -= 4;
      if (currentPlayer.angle <= -360) { currentPlayer.angle = 0; }
    }
    else {
      currentPlayer.angle -= 5;
      if (currentPlayer.angle <= -360) { currentPlayer.angle = 0; }
    }
    // console.log("Current Angle:", currentPlayer.angle)
  });

  socket.on('rightPressed', function(player) {
    if (player.speed > 17) {
      currentPlayer.angle += 3;
      if (currentPlayer.angle >=360) { currentPlayer.angle = 0; }
    }
    else if (player.speed > 13) {
      currentPlayer.angle += 4;
      if (currentPlayer.angle >=360) { currentPlayer.angle = 0; }
    }
    else {
      currentPlayer.angle += 5;
      if (currentPlayer.angle >=360) { currentPlayer.angle = 0; }
    }
    // console.log("Current Angle:", currentPlayer.angle)
  });

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

  socket.on('twoPressed', function(player) {
    if (player.health >= 1 && player.homingMissiles > 0) {
      homingMissileId += 1;
      currentPlayer.homingMissiles--;
      var homingMissile = new HomingMissile(
        currentPlayer.x,    // X
        currentPlayer.y,    // Y
        homingMissileId,    // ID
        player.id,          // Shooter ID
        player.id,          // Tracked Player's ID
        25,                 // Speed
        currentPlayer.angle // Angle
      );
      homingMissiles.push(homingMissile);
    }
  });

  socket.on('onePressed', function(player) {
    if (player.health >= 1 && player.missiles > 0) {
      missileId += 1;
      currentPlayer.missiles--;
      var missile = new Missile(
        currentPlayer.x,    // X
        currentPlayer.y,    // Y
        missileId,          // ID
        player.id,          // Shooter ID
        35,                 // Speed
        currentPlayer.angle // Angle
      );
      missiles.push(missile);
    }
  });

  socket.on('upPressed', function(player) {
    if (player.speed <= 20) currentPlayer.speed += 0.25;
  });

  socket.on('downPressed', function(player) {
    if (player.speed >= 12) currentPlayer.speed -= 0.25;
  });

  var reloading = 1;

  socket.on('reload', function(player) {
    if (reloading === 1) {
      reloading = 2;
      setTimeout(function() {
        currentPlayer.ammo = 10;
        reloading = 1;
      }, 3000);
    }
  });

  socket.on('hurtPlayer', function(player) {
    currentPlayer.health = 1;
  })

  socket.on('spawnComputerPlayer', function(player) {
    spawnComputerPlayer();
  })

  socket.on('reloadHomingMissiles', function(player) {
    currentPlayer.homingMissiles = 10;
  })

  socket.on('disconnect', function(player) {
    console.log('Socket with this id disconnected:', socket.id);
    players = players.filter(function(p) {
      return p.id !== socket.id;
    });
  });
});

module.exports = io;
