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
var players = [];
var bullets = [];
var leaderboard = [];
var plane;
var leftPress;
var rightPress;
var shiftPress;
var upPress;
var downPress;

$(document).on('keydown', function(e) {
  if (mav) {
    if (e.keyCode === 68 || e.keyCode === 39) {
      rightPress = true;
    }
    if (e.keyCode === 65 || e.keyCode === 37) {
      leftPress = true;
    }
    if (e.keyCode === 38 || e.keyCode === 87) {
      upPress = true;
    }
    if (e.keyCode === 16) {
      shiftPress = true;
    }
  }
});

$(document).on('keyup', function(e) {
  if (mav) {
    if (e.keyCode === 68 || e.keyCode === 39) {
      rightPress = false;
    }
    if (e.keyCode === 65 || e.keyCode === 37) {
      leftPress = false;
    }
    if (e.keyCode === 38 || e.keyCode === 87) {
      upPress = false;
    }
    if (e.keyCode === 16) {
      shiftPress = false;
      // keyPressHandler();
    }
  }
});

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

var planes = [spitfire, zero, mustang, lightning];

var bulletImg = new Image();
bulletImg.src = '/images/bullet.png';

var tileMap = new Image();
tileMap.src = '/images/map-2.png';

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
	this.x = 0;
	this.y = 0;
	this.width = width;
	this.height = height;
};

Camera.prototype.move = function(x, y) {
	this.x = x;
  this.y = y;
};

// ********************************************************************
// **************************** Game Stuff ****************************
// ********************************************************************

function Client(name, plane, id, x, y, speed, angle, health, points) {
  this.name = name;
  this.plane = plane;
  this.id = id;
  this.x = x;
  this.y = y;
  this.angle = angle;
  this.speed = speed;
  this.health = health;
  this.points = points;
};

function Maverick(context, camera, client, players, bullets) {
  this.ctx    = context;
  this.camera = camera;
  this.client = client;
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

Maverick.prototype.shiftHandler = function() {
  var self = this;
  if (shiftPress) {
    socket.emit('shiftPressed', self.client);
  }
  if (!shiftPress) {
    socket.emit('shiftUp', self.client);
  }
}

Maverick.prototype.run = function() {
  this.tick();

  var self = this;
  setInterval(function() {
    self.keyPressHandler.call(self)
  }, 30);

  setInterval(function() {
    self.shiftHandler.call(self)
  }, 100);
};

// Maverick.prototype.requestAnimationFrame = window.requestAnimationFrame;

Maverick.prototype.tick = function(elapsed) {
  window.requestAnimationFrame(this.tick.bind(this));

  // clear previous frame
  this.ctx.clearRect(0, 0, 1280, 960);
  // render next frame
  this.render();
  // keyPressHandler();
}

Maverick.prototype.render = function() {

  this.ctx.canvas.width  = window.innerWidth;
  this.ctx.canvas.height = window.innerHeight;

  this.updateCam();
  // this.drawGrid();
  this.drawMap();
  this.drawEnemies();
  this.drawBullets();
  this.drawPlane();
  this.drawLeaderboard();
  this.drawLeaders();
};

// ********************************************************************
// *************************** Canvas Stuff ***************************
// ********************************************************************

Maverick.prototype.drawMap = function () {
  this.ctx.save();
  this.ctx.drawImage(tileMap, 0, 0, 5000, 5000,
    -mav.camLeftBound, -mav.camTopBound, 5000, 5000);
  this.ctx.restore();
}

Maverick.prototype.drawPlane = function() {
  this.ctx.save();
  this.ctx.translate(canvas.width / 2, canvas.height / 2);
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'bottom';
  this.ctx.font = "18px 'Lucida Grande'";
  this.ctx.fillStyle = 'blue';
  this.ctx.fillText(this.client.name, 0, -85);
  this.ctx.fillStyle = 'grey';
  this.ctx.fillText('Health: ' + this.client.health, 0, -65);
  this.ctx.rotate(Math.PI / 180 * this.client.angle);
  this.ctx.drawImage(planes[this.client.plane], -60, -60, 120, 120);
  this.ctx.restore();
};

Maverick.prototype.drawEnemies = function() {
  var self = this;
  if (players.length >= 1) {
    players.forEach(function(p) {
      if (p.id !== self.client.id) {
        if (
           p.x < self.camRightBound
        && p.x > self.camLeftBound
        && p.y < self.camBottomBound
        && p.y > self.camTopBound
        ) {
          self.ctx.save();
          self.ctx.translate(p.x - self.camLeftBound, p.y - self.camTopBound);
          self.ctx.textAlign = 'center';
          self.ctx.textBaseline = 'bottom';
          self.ctx.font = "18px 'Lucida Grande'";
          self.ctx.fillStyle = 'red';
          self.ctx.fillText(p.name, 0, -85);
          self.ctx.fillStyle = 'grey';
          self.ctx.fillText('Health: ' + p.health, 0, -65);
          self.ctx.rotate(Math.PI / 180 * p.angle);
          self.ctx.drawImage(planes[p.plane], -60, -60, 120, 120);
          self.ctx.restore();
        }
      }
    });
  };
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

Maverick.prototype.drawLeaderboard = function() {
  this.ctx.globalAlpha = 0.3;
  this.fillStyle = 'black';
  this.ctx.fillRect(20,20,200,200);
  this.ctx.globalAlpha = 1;
};

Maverick.prototype.drawLeaders = function() {
  var self = this;
  var leaderY = 50;
  self.ctx.fillStyle = 'white';
  self.ctx.font = "18px 'Lucida Grande'";
  self.ctx.fillText('Leaderboard:', 35, 50);
  self.ctx.fillStyle = 'black';
  leaderboard.forEach(function(p) {
    leaderY += 25;
    self.ctx.globalAlpha = 1;
    self.ctx.fillStyle = 'white';
    self.ctx.font = "18px 'Lucida Grande'";
    self.ctx.fillText(p.name + ': ' + p.points + " pts", 35, leaderY);
    self.ctx.fillStyle = 'black';
  });
};

// Join the game when the start button is clicked!
$('#start').on('click', function () {
  plane = $('#select').val();
  var client = new Client($('#name').val(), plane, socket.id);
  socket.emit('spawn', client);
});

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
    , updatedSettings.points)

  var camera = new Camera(map, canvas.width, canvas.height)

  mav = new Maverick(
    canvas.getContext('2d')
    , camera
    , client
  );
  $('#menu').hide();
  mav.run();
});

socket.on("rejoinGame", function(updatedSettings) {
  mav.client = updatedSettings;
})

socket.on('movePlane', function(playerData) {
  mav.client.x = playerData.x;
  mav.client.y = playerData.y;
  mav.client.speed = playerData.speed;
  mav.client.health = playerData.health;
  mav.client.angle = playerData.angle;
  mav.client.points = playerData.points;
});

socket.on('moveBullets', function(bulletData) {
  bullets = bulletData;
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
    $('#controls').hide();
    $('#select').hide();
    $('#reload').show();
    $('#menu').show();
  }
});
