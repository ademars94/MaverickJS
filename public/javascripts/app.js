// Copyright (C) Alex DeMars - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Written by Alex DeMars <alexdemars@gmail.com>, March, 2016

console.log('Maverick 2D!');
$('#reload').hide();

// ********************************************************************
// *************************** Maverick 2D ****************************
// ********************************************************************

// Global Variables

var socket = io();
console.log(socket);

var canvas = $('#canvas')[0];
var ctx = canvas.getContext('2d');
var angle = 0;
var rotate = 0;
var lastFrame = Date.now();
var frameTime = 0;
var players = [];
var bullets = [];
var availableItems = [];
var leaderboard = [];
var homingMissiles = [];
var missiles = [];
var plane;
var leftPress;
var rightPress;
var spacePress;
var onePress;
var twoPress;
var upPress;
var downPress;

$(document).on('keydown', function(e) {
  if (players.length > 0) {
    if (e.keyCode === 39 || e.keyCode === 68) {
      rightPress = true;
    }
    if (e.keyCode === 37 || e.keyCode === 65) {
      leftPress = true;
    }
    if (e.keyCode === 38 || e.keyCode === 87) {
      upPress = true;
    }
    if (!spacePress && e.keyCode === 32) {
      spacePress = true;
      spaceHandler();
    }
    if (e.keyCode === 80) {
      spawnComputerPlayer();
    }
    if (!onePress && e.keyCode === 49 || e.keyCode === 75) {
      onePress = true;
      oneHandler();
    }
    if (!twoPress && e.keyCode === 50 || e.keyCode === 76) {
      twoPress = true;
      twoHandler();
    }
    if (e.keyCode === 16 || e.keyCode === 74) {
      socket.emit('reload', mav.client);
      if (mav.client.ammo < 10) {
        mav.reloading = true;
        setTimeout(function() {
          mav.reloading = false;
        }, 3000)
      }
    }
  }
});

$(document).on('keyup', function(e) {
  if (players.length > 0) {
    if (e.keyCode === 39 || e.keyCode === 68) {
      rightPress = false;
    }
    if (e.keyCode === 37 || e.keyCode === 65) {
      leftPress = false;
    }
    if (e.keyCode === 38 || e.keyCode === 87) {
      upPress = false;
    }
    if (e.keyCode === 32) {
      spacePress = false;
      spaceHandler();
    }
    if (e.keyCode === 49 || e.keyCode === 75) {
      onePress = false;
      oneHandler();
    }
    if (e.keyCode === 50 || e.keyCode === 76) {
      twoPress = false;
      twoHandler();
    }
  }
});

var touchX;

var canv = document.getElementById("canvas");
canv.addEventListener('touchstart', tap, false);
function tap(event) {
  touchX = event.clientX;
  if (touchX > 350) {
    socket.emit('spacePressed', mav.client);
    event.preventDefault();
  }
}

function spaceHandler() {
  if (spacePress) {
    socket.emit('spacePressed', mav.client);
  }
}

function oneHandler() {
  if (onePress) {
    socket.emit('onePressed', mav.client);
  }
}

function twoHandler() {
  if (twoPress) {
    socket.emit('twoPressed', mav.client);
  }
}

$('#reload').on('click', function() {
  socket.emit('respawn', mav.client);
  $('#menu').hide();
});

// Image Stuff

var spitfire = new Image();
spitfire.src = '/images/spitfire.png';

var zero = new Image();
zero.src = '/images/zero.png';

var mustang = new Image();
mustang.src = '/images/mustang.png';

var lightning = new Image();
lightning.src = '/images/lightning.png';

var messerschmitt = new Image();
messerschmitt.src = '/images/messerschmitt.png';

var tigercat = new Image();
tigercat.src = '/images/tigercat.png';

var planes = [spitfire, zero, mustang, lightning, messerschmitt, tigercat];

var bulletImg = new Image();
bulletImg.src = '/images/bullet.png';

var tileMap = new Image();
tileMap.src = '/images/map-2.png';

var healthImg = new Image();
healthImg.src = '/images/health.png'

var homingMissileImg = new Image();
homingMissileImg.src = '/images/homing-missile.png'

var missileImg = new Image();
missileImg.src = '/images/missile.png'

// Map Stuff

var map = {
	cols: 10,
	rows: 10,
	tileSize: 500
};

// ********************************************************************
// *************************** Camera Stuff ***************************
// ********************************************************************

function Camera(map, width, height) {
	this.x      = 0;
	this.y      = 0;
	this.width  = width;
	this.height = height;
};

Camera.prototype.move = function(x, y) {
	this.x = x;
  this.y = y;
};

// ********************************************************************
// **************************** Game Stuff ****************************
// ********************************************************************

function Client(name, plane, id, x, y, speed, angle, health, points, ammo, homingMissiles, missiles) {
  this.name   = name;
  this.plane  = plane;
  this.id     = id;
  this.x      = x;
  this.y      = y;
  this.angle  = angle;
  this.speed  = speed;
  this.health = health;
  this.points = points;
  this.ammo   = ammo;
  this.homingMissiles = homingMissiles;
  this.missiles = missiles;
};

function Maverick(context, camera, client, players, bullets) {
  this.ctx     = context;
  this.camera  = camera;
  this.client  = client;
  this.players = players;
  this.bullets = bullets;
}

Maverick.prototype.updateCam = function(delta) {
  this.camLeftBound   = this.client.x - (canvas.width / 2);
  this.camRightBound  = this.client.x + (canvas.width / 2);
  this.camTopBound    = this.client.y - (canvas.height / 2);
  this.camBottomBound = this.client.y + (canvas.height / 2);
  this.camera.move(this.client.x, this.client.y);
}

Maverick.prototype.keyPressHandler = function() {
  var self = this;
  if (leftPress) {
    socket.emit('leftPressed', self.client);
  }
  if (rightPress) {
    socket.emit('rightPressed', self.client);
  }
  if (upPress) {
    socket.emit('upPressed', self.client);
  }
  if (!upPress) {
    socket.emit('downPressed', self.client);
  }
};

Maverick.prototype.ping = function() {
  this.startPingTime = Date.now();
  socket.emit('ping');
}

// Maverick.prototype.spaceHandler = function() {
//   var self = this;
//   if (spacePress) {
//     socket.emit('spacePressed', self.client);
//   }
//   if (!spacePress) {
//     socket.emit('spaceUp', self.client);
//   }
// }

Maverick.prototype.run = function() {
  this.tick();
  // this.spaceHandler();
  var self = this;
  setInterval(function() {
    self.keyPressHandler.call(self)
  }, 30);

  setInterval(function() {
    self.ping.call(self)
  }, 150);
};

// Maverick.prototype.requestAnimationFrame = window.requestAnimationFrame;

Maverick.prototype.tick = function(elapsed) {
  window.requestAnimationFrame(this.tick.bind(this));

  this.render();
}

Maverick.prototype.render = function() {
  rotate += 3;

  var filterStrength = 10;
  var thisFrame = Date.now();
  var delta = thisFrame - lastFrame;
  frameTime += (delta - frameTime) / filterStrength;

  this.fps = (1000 / frameTime).toFixed();
  lastFrame = thisFrame;
  // console.log("FPS:", fps);

  this.ctx.canvas.width  = window.innerWidth;
  this.ctx.canvas.height = window.innerHeight;

  this.updateCam();
  // this.drawGrid();
  this.drawMap();
  this.drawAvailableItems();
  this.drawBullets();
  this.drawHomingMissiles();
  this.drawMissiles();
  this.drawEnemies();
  this.drawPlane();
  this.drawLeaderboard();
  this.drawLeaders();
  this.drawAmmo();
  this.drawDiagnostics();
};

// ********************************************************************
// *************************** Canvas Stuff ***************************
// ********************************************************************

Maverick.prototype.drawDiagnostics = function() {
  this.ctx.fillStyle = 'black';
  this.ctx.globalAlpha = 0.3;
  this.ctx.fillRect(20, 240, 300, 68);
  this.ctx.globalAlpha = 1;

  this.ctx.fillStyle = 'white';
  this.ctx.font = "18px 'Lucida Grande'";
  this.ctx.fillText('FPS: ' + this.fps, 32, 268);
  this.ctx.fillText('Ping: ' + this.latency + " milliseconds", 32, 294);
}

Maverick.prototype.drawMap = function () {
  this.ctx.save();
  this.ctx.drawImage(tileMap, 0, 0, 4096, 4096,
    -mav.camLeftBound - 2048, -mav.camTopBound - 2048, 4096, 4096);
  this.ctx.restore();
}

Maverick.prototype.drawPlane = function() {
  var color;

  if (this.client.health > 14) {
    color = '#2ecc71'
  }
  else if (this.client.health > 7) {
    color = '#f1c40f'
  }
  else {
    color = '#e74c3c'
  }

  this.ctx.save();
  this.ctx.translate(canvas.width / 2, canvas.height / 2);
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'bottom';
  this.ctx.font = "18px 'Lucida Grande'";
  this.ctx.fillStyle = 'blue';
  this.ctx.fillText(this.client.name, 0, -90);
  this.ctx.fillStyle = color;
  this.ctx.fillRect(-50, -85, this.client.health*5, 10);
  this.ctx.rotate(Math.PI / 180 * this.client.angle);
  this.ctx.drawImage(planes[this.client.plane], -60, -60, 120, 120);
  this.ctx.restore();
};

Maverick.prototype.drawEnemies = function() {
  var self = this;
  players.forEach(function(p) {
    if (p.id !== self.client.id) {
      if (
         p.x < self.camRightBound + 60
      && p.x > self.camLeftBound - 60
      && p.y < self.camBottomBound + 120
      && p.y > self.camTopBound - 60
      ) {

        var color;

        if (p.health > 14) {
          color = '#2ecc71'
        }
        else if (p.health > 7) {
          color = '#f1c40f'
        }
        else {
          color = '#e74c3c'
        }

        self.ctx.save();
        self.ctx.translate(p.x - self.camLeftBound, p.y - self.camTopBound);
        self.ctx.textAlign = 'center';
        self.ctx.textBaseline = 'bottom';
        self.ctx.font = "18px 'Lucida Grande'";
        self.ctx.fillStyle = '#e74c3c';
        self.ctx.fillText(p.name, 0, -90);
        self.ctx.fillStyle = color;
        self.ctx.fillRect(-50, -85, p.health*5, 10);
        self.ctx.rotate(Math.PI / 180 * p.angle);
        self.ctx.drawImage(planes[p.plane], -60, -60, 120, 120);
        self.ctx.restore();
      }
    }
  });
};

Maverick.prototype.drawBullets = function() {
  var self = this;
  if (bullets.length >= 1) {
    bullets.forEach(function(b) {
      if (
        b.x < self.camRightBound  &&
        b.x > self.camLeftBound   &&
        b.y < self.camBottomBound &&
        b.y > self.camTopBound
      ) {
        self.ctx.save();
        self.ctx.translate(b.x - self.camLeftBound, b.y - self.camTopBound);
        self.ctx.rotate(Math.PI / 180 * b.angle);
        self.ctx.drawImage(bulletImg, -12, -12, 24, 24);
        self.ctx.restore();
      }
    });
  };
};

Maverick.prototype.drawHomingMissiles = function() {
  var self = this;
  if (homingMissiles.length >= 1) {
    homingMissiles.forEach(function(hm) {
      if (
        hm.x < self.camRightBound  &&
        hm.x > self.camLeftBound   &&
        hm.y < self.camBottomBound &&
        hm.y > self.camTopBound
      ) {
        self.ctx.save();
        self.ctx.translate(hm.x - self.camLeftBound, hm.y - self.camTopBound);
        self.ctx.rotate(Math.PI / 180 * hm.angle);
        self.ctx.drawImage(homingMissileImg, -16, -32, 32, 64);
        self.ctx.restore();
      }
    });
  };
};

Maverick.prototype.drawMissiles = function() {
  var self = this;
  if (missiles.length >= 1) {
    missiles.forEach(function(m) {
      if (
        m.x < self.camRightBound  &&
        m.x > self.camLeftBound   &&
        m.y < self.camBottomBound &&
        m.y > self.camTopBound
      ) {
        self.ctx.save();
        self.ctx.translate(m.x - self.camLeftBound, m.y - self.camTopBound);
        self.ctx.rotate(Math.PI / 180 * m.angle);
        self.ctx.drawImage(missileImg, -16, -32, 32, 64);
        self.ctx.restore();
      }
    });
  };
};

Maverick.prototype.drawHealthPacks = function() {
  var self = this;
  if (healthPacks.length >= 1) {
    healthPacks.forEach(function(pack) {
      if (
        pack.x < self.camRightBound  &&
        pack.x > self.camLeftBound   &&
        pack.y < self.camBottomBound &&
        pack.y > self.camTopBound
      ) {
        self.ctx.save();
        self.ctx.translate(pack.x - self.camLeftBound, pack.y - self.camTopBound);
        self.ctx.drawImage(healthImg, -24, -24, 48, 48);
        self.ctx.restore();
      }
    });
  };
};

Maverick.prototype.drawAvailableItems = function() {
  var self = this;
  if (availableItems.length >= 1) {
    availableItems.forEach(function(i) {
      if (
        i.x < self.camRightBound  &&
        i.x > self.camLeftBound   &&
        i.y < self.camBottomBound &&
        i.y > self.camTopBound
      ) {
        if (i.type === 0) {
          self.ctx.save();
          self.ctx.translate(i.x - self.camLeftBound, i.y - self.camTopBound);
          self.ctx.drawImage(healthImg, -24, -24, 48, 48);
          self.ctx.restore();
        }
        if (i.type === 1) {
          self.ctx.save();
          self.ctx.translate(i.x - self.camLeftBound, i.y - self.camTopBound);
          self.ctx.rotate(Math.PI / 180 * rotate);
          self.ctx.drawImage(missileImg, -16, -32, 32, 64);
          self.ctx.restore();
        }
        if (i.type === 2) {
          self.ctx.save();
          self.ctx.translate(i.x - self.camLeftBound, i.y - self.camTopBound);
          self.ctx.rotate(Math.PI / 180 * rotate);
          self.ctx.drawImage(homingMissileImg, -16, -32, 32, 64);
          self.ctx.restore();
        }
      }
    });
  };
};

Maverick.prototype.drawAmmo = function() {
  // console.log("Ammo:", mav.client.ammo);
  var self = this;
  var ammoY = canvas.height - 96;
  var ammoX = 24;
  for (var i = mav.client.ammo; i > 0; i--) {
    self.ctx.drawImage(bulletImg, ammoX, ammoY, 64, 64);
    ammoX += 24;
  }
  for (var i = mav.client.missiles; i > 0; i--) {
    self.ctx.drawImage(missileImg, ammoX + 48, ammoY, 32, 64);
    ammoX += 48;
  }
  for (var i = mav.client.homingMissiles; i > 0; i--) {
    self.ctx.drawImage(homingMissileImg, ammoX + 48, ammoY, 32, 64);
    ammoX += 48;
  }
  if (mav.client.ammo < 1 || mav.reloading) {
    self.ctx.fillStyle = 'grey';
    self.ctx.font = "36px 'Lucida Grande'";
    self.ctx.fillText('Reloading...', ammoX + 48, canvas.height - 48);
  }
}

Maverick.prototype.drawLeaderboard = function() {
  this.ctx.globalAlpha = 0.3;
  this.fillStyle = 'black';
  this.ctx.fillRect(20,20,300,200);
  this.ctx.globalAlpha = 1;
};

Maverick.prototype.drawLeaders = function() {
  var self = this;
  var leaderY = 50;
  self.ctx.fillStyle = 'white';
  self.ctx.font = "18px 'Lucida Grande'";
  self.ctx.fillText('Leaderboard:', 105, 50);
  self.ctx.fillStyle = 'black';
  leaderboard.forEach(function(p) {
    leaderY += 25;
    self.ctx.globalAlpha = 1;
    self.ctx.fillStyle = 'white';
    self.ctx.font = "18px 'Lucida Grande'";
    self.ctx.fillText("✈ " + p.name + ': ' + p.points + " pts", 35, leaderY);
    self.ctx.fillStyle = 'black';
  });
};

// Join the game when the start button is clicked!
$('#start').on('click', function () {
  plane = $('#select').val();
  var client = new Client($('#name').val(), plane, socket.id);
  socket.emit('spawn', client);
});

function hurtPlayer() {
  socket.emit('hurtPlayer', mav.client);
}

function spawnComputerPlayer() {
  socket.emit('spawnComputerPlayer', mav.client);
}

function reloadHomingMissiles() {
  socket.emit('reloadHomingMissiles', mav.client);
}

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

socket.on('joinGame', function (updatedSettings) {
  var context = canvas.getContext('2d');

  console.log("Updated Settings:", updatedSettings)

  var client = new Client(updatedSettings.name
    , updatedSettings.plane
    , updatedSettings.id
    , updatedSettings.x
    , updatedSettings.y
    , updatedSettings.speed
    , updatedSettings.angle
    , updatedSettings.health
    , updatedSettings.points
    , updatedSettings.ammo
    , updatedSettings.homingMissiles
    , updatedSettings.missiles)

  var camera = new Camera(map, canvas.width, canvas.height)

  mav = new Maverick(
    canvas.getContext('2d')
    , camera
    , client
  );
  $('#menu').hide();
  mav.run();
});

socket.on('pong', function () {
  mav.latency = Date.now() - mav.startPingTime;
  // console.log("Latency:", mav.latency, "ms");
  // debug('Latency: ' + latency + 'ms');
  // chat.addSystemLine('Ping: ' + latency + 'ms');
});

socket.on("rejoinGame", function(updatedSettings) {
  mav.client = updatedSettings;
})

socket.on('movePlane', function(playerData) {
  mav.client.x      = playerData.x;
  mav.client.y      = playerData.y;
  mav.client.speed  = playerData.speed;
  mav.client.health = playerData.health;
  mav.client.angle  = playerData.angle;
  mav.client.points = playerData.points;
  mav.client.ammo   = playerData.ammo;
  mav.client.homingMissiles = playerData.homingMissiles;
  mav.client.missiles = playerData.missiles;
});

socket.on('moveBullets', function(bulletData) {
  bullets = bulletData;
});

socket.on('moveHomingMissiles', function(homingMissileData) {
  homingMissiles = homingMissileData;
});

socket.on('moveMissiles', function(missileData) {
  missiles = missileData;
});

socket.on('updateItems', function(availableItemData) {
  availableItems = availableItemData;
});

socket.on('updateAllPlayers', function(otherPlayers) {
  players = otherPlayers;
});

socket.on('updateAllLeaderboards', function(leaderboardData) {
  leaderboard = leaderboardData;
});

socket.on('shotFired', function(playerData) {
  console.log(playerData.name, 'is shooting!');
});

socket.on('playerDie', function(playerData) {
  console.log(playerData.name, 'was shot down!');
  if (playerData.id === mav.client.id) {
    $('#inputs').hide();
    $('#start').hide();
    $('#controls').hide();
    $('#select').hide();
    $('#reload').show();
    $('#menu').show();
  }
});
