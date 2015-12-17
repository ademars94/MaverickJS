console.log('Maverick 2D!');

// ********************************************************************
// *************************** Maverick 2D ****************************
// ********************************************************************

// Global Variables

var socket = io();
console.log(socket);

var Maverick = {};

var canvas = $('#canvas')[0];
var ctx = canvas.getContext('2d');

var planeX = 1280;
var planeY = 1280;
var angle = 0;
var player = {};
var players = [];
var bullets = [];

var camLeftBound;
var camRightBound;
var camTopBound;
var camBottomBound;

var mapRightBound = 0;
var mapLeftBound = 2560;
var mapBottomBound = 2560;
var mapTopBound = 0;

function keypress_handler(event) {
  if (event.keyCode == 65 || event.keyCode == 37) {
    socket.emit('leftPressed', player);
  }
  if (event.keyCode == 68 || event.keyCode == 39) {
    socket.emit('rightPressed', player);
  }
  if (event.keyCode == 16) {
    socket.emit('shiftPressed', player);
  }
}

// Image Stuff

var spitfire = new Image();
spitfire.src = '/images/spitfire.png';

var zero = new Image();
zero.src = '/images/zero.png';

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
}

Camera.prototype.move = function(delta, camX, camY) {
	this.x = planeX - canvas.width / 2;
  this.y = planeY - canvas.height / 2;
}

Maverick.init = function() {
  this.camera = new Camera(map, canvas.width, canvas.height);
}

Maverick.updateCam = function(delta) {
  var camX = planeX;
  var camY = planeY;
  camLeftBound = planeX - (canvas.width / 2);
  camRightBound = planeX + (canvas.width / 2);
  camTopBound = planeY - (canvas.height / 2);
  camBottomBound = planeY + (canvas.height / 2);
  this.camera.move(delta, camX, camY)
}

// ********************************************************************
// **************************** Game Stuff ****************************
// ********************************************************************

Maverick.run = function(context) {
  this.ctx = context;
  this._previousElapsed = 0;
  this.init();
  window.requestAnimationFrame(this.tick);
};

Maverick.tick = function(elapsed) {
  window.requestAnimationFrame(this.tick);

  // clear previous frame
  this.ctx.clearRect(0, 0, 1280, 960);

  // compute delta time in seconds -- also cap it
  var delta = (elapsed - this._previousElapsed) / 1000.0;
  delta = Math.min(delta, 0.25); // maximum delta of 250 ms
  this._previousElapsed = elapsed;

  this.updateCam(delta);
  this.render();
}.bind(Maverick);

Maverick.render = function() {
  this.drawGrid();
  this.drawEnemies();
  this.drawBullets();
  this.drawPlane();
  // this.checkCollision();
};

// ********************************************************************
// *************************** Canvas Stuff ***************************
// ********************************************************************

Maverick.drawGrid = function () {
  var width = map.cols * map.tileSize;
  var height = map.rows * map.tileSize;
  var x, y;

  for (var r = 0; r <= map.rows; r++) {
    x = - this.camera.x;
    y = r * map.tileSize - this.camera.y;
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#F2F1EF';
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(height, y);
    this.ctx.closePath();
    this.ctx.stroke();
  }
  for (var c = 0; c <= map.cols; c++) {
    x = c * map.tileSize - this.camera.x;
    y = - this.camera.y;
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#F2F1EF';
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x, width);
    this.ctx.closePath();
    this.ctx.stroke();
  }
};

Maverick.drawPlane = function() {
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 180 * angle);
  ctx.drawImage(spitfire, -60, -60, 120, 120);
  ctx.restore();
};

Maverick.drawEnemies = function() {
  players.forEach(function(p) {
    if (p.id !== player.id) {
      if (p.planeX < camRightBound
      && p.planeX > camLeftBound
      && p.planeY < camBottomBound
      && p.planeY > camTopBound) {
        ctx.save();
        ctx.translate(p.planeX - camLeftBound, p.planeY - camTopBound);
        ctx.rotate(Math.PI / 180 * p.angle);
        ctx.drawImage(zero, -60, -60, 120, 120);
        ctx.restore();
      }
    }
  });
};

Maverick.drawBullets = function() {
  bullets.forEach(function(bullet) {
    if (bullet.x < camRightBound
    && bullet.x > camLeftBound
    && bullet.y < camBottomBound
    && bullet.y > camTopBound) {
      ctx.save();
      ctx.translate(bullet.x - camLeftBound, bullet.y - camTopBound);
      ctx.rotate(Math.PI / 180 * bullet.angle);
      ctx.drawImage(bulletImg, -8, -8, 16, 16);
      ctx.restore();
    }
  });
};

// Join the game when the start button is clicked!
$('#start').on('click', function () {
  // Add key listeners only when the game is running to prevent errors!
  window.addEventListener("keydown", keypress_handler, false);
  player.name = $('#name').val();
  player.id = socket.id;
  newPlayer = player;
  socket.emit('respawn', newPlayer);
  // console.log(player.name + " has entered the game!");
});

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

socket.on('joinGame', function (playerSettings) {
  var context = canvas.getContext('2d');
  Maverick.run(context);
  $('#menu').hide();

  player = playerSettings;

  console.log(player.id + " has entered the game!");
});

socket.on('movePlane', function(playerData) {
  planeX = playerData.planeX;
  planeY = playerData.planeY;
  angle = playerData.angle;
});

socket.on('playerHit', function(playerData) {
  console.log(playerData.name, 'has been hit!');
});

socket.on('moveBullets', function(bulletData) {
  // console.log(bulletData);
  bullets = bulletData;
});

socket.on('updateAllPlayers', function(otherPlayers) {
  players = otherPlayers;
});

socket.on('shotFired', function(playerData) {
  console.log(playerData.name, 'is firing!');
});

socket.on('playerDie', function(playerData) {
  console.log(playerData.name, 'was shot down!');
  if (playerData.id === player.id) {
    $('#menu').show();
  }
});










