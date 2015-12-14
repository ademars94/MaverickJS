console.log('hello world');

var socket = io();
console.log(socket);

var canvas = $('#canvas')[0];
var ctx = canvas.getContext('2d');

// Global Vars from Racing Game example

var planeX = canvas.width / 2;
var planeY = canvas.height / 2;
var speed = 5;
var angle = 0;
var mod = 1;

// Images

var spitfire,
		graySq,
		blueSq;

// Map Matrix

var map = {
	cols: 10,
	rows: 10,
	tsize: 500,
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
	getTile: function(layer, col, row) {
		return this.layers[layer][row * map.cols + col];
	}
};

// Camera Stuff

function Camera(map, width, height) {
	this.x = 0;
	this.y = 0;
	this.width = width;
	this.height = height;
	this.maxX = map.cols * map.tsize - width;
	this.maxY = map.rows * map.tsize - height;
}

Camera.prototype.move = function(delta, dirX, dirY) {
	this.x = planeX * 1;
  this.y = planeY * 1;
  // this.x = Math.max(0, Math.min(this.x, this.maxX));
  // this.y = Math.max(0, Math.min(this.y, this.maxY));
}

// Game Functions

var Maverick = {};


spitfire = new Image();
spitfire.src = '/images/spitfire.png';

graySq = new Image();
graySq.src = '/images/gray-square.png';

blueSq = new Image();
blueSq.src = '/images/light-blue-square.png';


Maverick.run = function (context) {
    this.ctx = context;
    this._previousElapsed = 0;
    console.log(this.ctx);
    
    this.init();
    window.requestAnimationFrame(this.tick);
};

Maverick.tick = function (elapsed) {
	console.log('tick');
    window.requestAnimationFrame(this.tick);

    // clear previous frame
    this.ctx.clearRect(0, 0, 720, 480);

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
	var dirX = planeX;
	var dirY = planeY;
	this.camera.move(delta, dirX, dirY)
}

Maverick._drawLayer = function (layer) {
  var startCol = Math.floor(this.camera.x / map.tsize);
  var endCol = startCol + (this.camera.width / map.tsize);
  var startRow = Math.floor(this.camera.y / map.tsize);
  var endRow = startRow + (this.camera.height / map.tsize);
  var offsetX = -this.camera.x + startCol * map.tsize;
  var offsetY = -this.camera.y + startRow * map.tsize;

  for (var c = startCol; c <= endCol; c++) {
    for (var r = startRow; r <= endRow; r++) {
      var tile = map.getTile(layer, c, r);
      var x = (c - startCol) * map.tsize + offsetX;
      var y = (r - startRow) * map.tsize + offsetY;
      if (tile !== 0) { // 0 => empty tile
        this.ctx.drawImage(
        	graySq, // image
        	0, // source x
        	0, // source y
        	500, // source width
        	500, // source height
        	Math.round(x),  // target x
        	Math.round(y), // target y
        	map.tsize, // target width
        	map.tsize // target height
        );
      }
    }
  }
  drawPlane();
};

Maverick.render = function () {
    // draw map background layer
    this._drawLayer(0);
};





window.addEventListener("keydown", keypress_handler, false);

function drawPlane() {

    planeX += (speed * mod) * Math.sin(Math.PI / 180 * angle);
    planeY += -(speed * mod) * Math.cos(Math.PI / 180 * angle);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 180 * angle);
    ctx.drawImage(spitfire, -90, -90, 180, 180);
    ctx.restore();
}

function keypress_handler(event) {
    console.log(event.keyCode);
    if (event.keyCode == 65) {
        angle -= 5;
    }
    if (event.keyCode == 68) {
        angle += 5;
    }
}

$('#canvas').on('click', function () {
    var context = canvas.getContext('2d');
    Maverick.run(context);
});