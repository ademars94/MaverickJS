console.log('hello world');

var socket = io();
console.log(socket);

var canvas = $('#canvas')[0];
var ctx = canvas.getContext('2d');

// Global Vars from Racing Game example

// var planeX = canvas.width / 2;
// var planeY = canvas.height / 2;
var planeX = 2500;
var planeY = 2500;
var speed = 10;
var angle = 0;
var mod = 0.5;
var player = {};

window.addEventListener("keydown", keypress_handler, false);

// Images

var spitfire = new Image();
spitfire.src = '/images/spitfire.png';

var graySq = new Image();
graySq.src = '/images/gray-square.png';

var blueSq = new Image();
blueSq.src = '/images/light-blue-square.png';

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

// Camera Stuff

function Camera(map, width, height) {
	this.x = 0;
	this.y = 0;
	this.width = width;
	this.height = height;
	this.maxX = map.cols * map.tileSize - width;
	this.maxY = map.rows * map.tileSize - height;
}

Camera.prototype.move = function(delta, camX, camY) {
	this.x = planeX -640;
  this.y = planeY -360;
}

// Game Functions

var Maverick = {};

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

Maverick.init = function() {
	this.camera = new Camera(map, canvas.width, canvas.height);
}

Maverick.update = function(delta) {
	// debugger;
	var camX = planeX;
	var camY = planeY;
	this.camera.move(delta, camX, camY)
}


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

Maverick.render = function () {
  this._drawGrid();
  this.drawPlane();
};

function keypress_handler(event) {
  // console.log(event.keyCode);
  if (event.keyCode == 65) {
    socket.emit('leftPressed', player.id);
    // angle -= 5;
  }
  if (event.keyCode == 68) {
    socket.emit('rightPressed', player.id);
    // angle += 5;
  }
}

// Run the game when the canvas is clicked!

$('#start').on('click', function () {
  var context = canvas.getContext('2d');
  // Maverick.run(context);

  player.name = $('#name').val();
  player.id = socket.id;
  socket.emit('respawn', player);
});

// Socket stuff

socket.on('joinGame', function (playerSettings) {
  var context = canvas.getContext('2d');
  Maverick.run(context);

  player = playerSettings;

  console.log(player);
});

socket.on('angleChange', function(currentPlayer) {
  angle = currentPlayer.angle;
});

socket.on('updateClients', function(playerData) {
  console.log(playerData);
  planeX = playerData.planeX;
  planeY = playerData.planeY;
});

// Maverick._drawLayer = function (layer) {
// 	// This is the code responsible for rendering only the
// 	// portion of the map that is in the viewport
//   var startCol = Math.floor(this.camera.x / map.tileSize);
//   var endCol = startCol + (this.camera.width / map.tileSize);
//   var startRow = Math.floor(this.camera.y / map.tileSize);
//   var endRow = startRow + (this.camera.height / map.tileSize);
//   var offsetX = -this.camera.x + startCol * map.tileSize;
//   var offsetY = -this.camera.y + startRow * map.tileSize;

//   for (var c = startCol; c <= endCol; c++) {
//     for (var r = startRow; r <= endRow; r++) {
//       var tile = map.getTile(c, r);
//       var x = (c - startCol) * map.tileSize + offsetX;
//       var y = (r - startRow) * map.tileSize + offsetY;
//       if (tile !== 0) { // 0 => empty tile
//         this.ctx.drawImage(
// 	        graySq,
//         	Math.round(x),  // target x
//         	Math.round(y), // target y
//         	map.tileSize, // target width
//         	map.tileSize // target height
//         );
//       }
//     }
//   }
// };
