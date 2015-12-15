console.log('Maverick 2D!');

var socket = io();
console.log(socket);

var canvas = $('#canvas')[0];
var ctx = canvas.getContext('2d');

var planeX = 2500;
var planeY = 2500;
var angle = 0;
var player = {};
var players = [];

var Maverick = {};

window.addEventListener("keydown", keypress_handler, false);

function keypress_handler(event) {
  if (event.keyCode == 65) {
    socket.emit('leftPressed', player.id);
  }
  if (event.keyCode == 68) {
    socket.emit('rightPressed', player.id);
  }
}

// Images

var spitfire = new Image();
spitfire.src = '/images/spitfire.png';

var zero = new Image();
zero.src = '/images/zero.png';

// var graySq = new Image();
// graySq.src = '/images/gray-square.png';

// var blueSq = new Image();
// blueSq.src = '/images/light-blue-square.png';

// Map Matrix

var map = {
	cols: 10,
	rows: 10,
	tileSize: 500,
	layers: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
					 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
					 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
					 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
					 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
					 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
					 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
					 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
					 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
					 1, 0, 1, 0, 1, 0, 1, 0, 1, 0
					],
	getTile: function(col, row) {
		return this.layers[row * map.cols + col];
	}
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
	this.x = planeX -640;
  this.y = planeY -360;
}

Maverick.init = function() {
  this.camera = new Camera(map, canvas.width, canvas.height);
}

Maverick.update = function(delta) {
  // debugger;
  var camX = planeX;
  var camY = planeY;
  this.camera.move(delta, camX, camY)
}

// ********************************************************************
// **************************** Game Stuff ****************************
// ********************************************************************

Maverick.run = function (context) {
  this.ctx = context;
  this._previousElapsed = 0;
  this.init();
  window.requestAnimationFrame(this.tick);
};

Maverick.tick = function (elapsed) {
  window.requestAnimationFrame(this.tick);

  // clear previous frame
  this.ctx.clearRect(0, 0, 1280, 720);

  // compute delta time in seconds -- also cap it
  var delta = (elapsed - this._previousElapsed) / 1000.0;
  delta = Math.min(delta, 0.25); // maximum delta of 250 ms
  this._previousElapsed = elapsed;

  this.update(delta);
  this.render();
}.bind(Maverick);

Maverick.render = function () {
  this._drawGrid();
  this.drawPlane();
};

// ********************************************************************
// *************************** Canvas Stuff ***************************
// ********************************************************************

Maverick._drawGrid = function () {
  var width = map.cols * map.tileSize;
  var height = map.rows * map.tileSize;
  var x, y;

  for (var r = 0; r <= map.rows; r++) {
    x = - this.camera.x;
    y = r * map.tileSize - this.camera.y;
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#E6E6E6';
    this.ctx.lineWidth = 5;
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(height, y);
    this.ctx.closePath();
    this.ctx.stroke();
  }
  for (var c = 0; c <= map.cols; c++) {
    x = c * map.tileSize - this.camera.x;
    y = - this.camera.y;
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#E6E6E6';
    this.ctx.lineWidth = 5;
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
  players.forEach(function(player) {
  });
}

// Run the game when the canvas is clicked!

$('#start').on('click', function () {
  player.name = $('#name').val();
  player.id = socket.id;
  socket.emit('respawn', player);
  console.log(player.name + " has entered the game!");
});

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

socket.on('joinGame', function (playerSettings) {
  var context = canvas.getContext('2d');
  Maverick.run(context);

  player = playerSettings;

  console.log(player);
});

socket.on('movePlane', function(playerData) {
  planeX = playerData.planeX;
  planeY = playerData.planeY;
  angle = playerData.angle;
});

socket.on('updateAllPlayers', function(players) {
  console.log(players);
});
