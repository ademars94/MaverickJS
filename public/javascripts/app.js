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
var client;
var angle = 0;
var players = [];
var bullets = [];
var leaderboard = [];
var plane;
var leftPress;
var rightPress;
var shiftPress;

var camLeftBound;
var camRightBound;
var camTopBound;
var camBottomBound;

var mapRightBound = 0;
var mapLeftBound = 2560;
var mapBottomBound = 2560;
var mapTopBound = 0;

// Event Handlers

function shiftHandler() {
  if (shiftPress) {
    socket.emit('shiftPressed', client);
  }
  if (!shiftPress) {
    socket.emit('shiftUp', client);
  }
}

function keyPressHandler() {
  if (leftPress) {
    socket.emit('leftPressed', client);
  }
  if (rightPress) {
    socket.emit('rightPressed', client);
  }
  if (!leftPress) {
    socket.emit('leftUp', client);
  }
  if (!rightPress) {
    socket.emit('rightUp', client);
  }
};

$(document).on('keydown', function(e) {
  if (mav) {
    if (e.keyCode === 65 || e.keyCode === 37) {
      leftPress = true;
      console.log('Left Press:', leftPress);
      // keyPressHandler();
    }
    if (e.keyCode == 68 || e.keyCode == 39) {
      rightPress = true;
      console.log('Right Press:', rightPress);
      // keyPressHandler();
    }
    if (e.keyCode == 16) {
      shiftPress = true;
      shiftHandler();
    }
  }
});

$(document).on('keyup', function(e) {
  if (mav) {
    if (e.keyCode === 65 || e.keyCode === 37) {
      leftPress = false;
      console.log('Left Press:', leftPress);
      // keyPressHandler();
    }
    if (e.keyCode == 68 || e.keyCode == 39) {
      rightPress = false;
      console.log('Right Press:', rightPress);
      // keyPressHandler();
    }
    if (e.keyCode == 16) {
      shiftPress = false;
      // keyPressHandler();
    }
  }
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

// Map Stuff

var map = {
	cols: 16,
	rows: 16,
	tileSize: 160
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
  // debugger;
	this.x = x;
  this.y = y;
};

// ********************************************************************
// **************************** Game Stuff ****************************
// ********************************************************************

function Client(name, plane, id, x, y, angle, health, points) {
  this.name = name;
  this.plane = plane;
  this.id = id;
  this.x = x;
  this.y = y;
  this.angle = angle;
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

Maverick.prototype.run = function() {
  window.requestAnimationFrame(this.tick.bind(this));
};

// Maverick.prototype.requestAnimationFrame = window.requestAnimationFrame;

Maverick.prototype.tick = function(elapsed) {
  window.requestAnimationFrame(this.tick.bind(this));

  // clear previous frame
  this.ctx.clearRect(0, 0, 1280, 960);
  // render next frame
  this.setGlobal();
  this.render();
  keyPressHandler();
}

Maverick.prototype.render = function() {
  this.updateCam();
  this.drawGrid();
  this.drawEnemies();
  this.drawBullets();
  this.drawPlane();
  this.drawLeaderboard();
  this.drawLeaders();
};

// ********************************************************************
// *************************** Canvas Stuff ***************************
// ********************************************************************

Maverick.prototype.drawGrid = function () {
  var width = map.cols * map.tileSize;
  var height = map.rows * map.tileSize;
  var x, y;

  for (var r = 0; r <= map.rows; r++) {
    x = - this.camLeftBound;
    y = r * map.tileSize - this.camTopBound;
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#F2F1EF';
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(height, y);
    this.ctx.closePath();
    this.ctx.stroke();
  }
  for (var c = 0; c <= map.cols; c++) {
    x = c * map.tileSize - this.camLeftBound;
    y = - this.camTopBound;
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#F2F1EF';
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x, width);
    this.ctx.closePath();
    this.ctx.stroke();
  }
};

Maverick.prototype.drawPlane = function() {
  this.ctx.save();
  this.ctx.translate(canvas.width / 2, canvas.height / 2);
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'bottom';
  this.ctx.font = "18px 'Lucida Grande'";
  this.ctx.fillStyle = 'blue';
  this.ctx.fillText(client.name, 0, -85);
  this.ctx.fillStyle = 'grey';
  this.ctx.fillText('Health: ' + client.health, 0, -65);
  this.ctx.rotate(Math.PI / 180 * this.client.angle);
  this.ctx.drawImage(planes[client.plane], -60, -60, 120, 120);
  this.ctx.restore();
};

Maverick.prototype.drawEnemies = function() {
  var self = this;
  if (players.length > 1) {
    players.forEach(function(p) {
      if (p.id !== this.client.id) {
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
          self.ctx.fillText('Lives: ' + p.health, 0, -65);
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
  // console.log('Leaderboard:', leaderboard);
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

Maverick.prototype.setGlobal = function() {
  client = this.client
};

// Join the game when the start button is clicked!
$('#start').on('click', function () {
  plane = $('#select').val();
  console.log('Plane:', plane);
  // Add key listeners only when the game is running to prevent errors!
  // window.addEventListener("keydown", keypress_handler, false);
  client = new Client($('#name').val(), plane, socket.id);
  socket.emit('respawn', client);
});

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

socket.on('joinGame', function (updatedSettings) {
  var context = canvas.getContext('2d');

  mav = new Maverick(
    canvas.getContext('2d')
    , new Camera(map, canvas.width, canvas.height)
    , new Client(updatedSettings.name
    , updatedSettings.plane
    , updatedSettings.id
    , updatedSettings.x
    , updatedSettings.y
    , updatedSettings.angle
    , updatedSettings.health
    , updatedSettings.points)
    // , players
    // , bullets
  );
  $('#menu').hide();

  mav.run();
});

socket.on('movePlane', function(playerData) {
  client.x = playerData.x;
  client.y = playerData.y;
  client.health = playerData.health;
  client.angle = playerData.angle;
  client.points = playerData.points;
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

    $('#reload').on('click', function() {
      location.reload();
    });
    // mav2 = new Maverick(
    //   canvas.getContext('2d')
    //   , new Camera(map, canvas.width, canvas.height)
    //   , client
    // );
    // mav.run();
    // socket.emit('playAgain', mav.client);
  }
});
