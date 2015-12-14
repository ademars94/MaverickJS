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
var mod = 0.5;

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
	this.maxX = map.cols * map.tsize - width;
	this.maxY = map.rows * map.tsize - height;
}

Camera.prototype.move = function(delta, dirX, dirY) {
	this.x = planeX;
  this.y = planeY;
  // this.x = Math.max(0, Math.min(this.x, this.maxX));
  // this.y = Math.max(0, Math.min(this.y, this.maxY));
}

// Game Functions

var Maverick = {};

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

// Maverick._drawLayer = function (layer) {
// 	// This is the code responsible for rendering only the 
// 	// portion of the map that is in the viewport
//   var startCol = Math.floor(this.camera.x / map.tsize);
//   var endCol = startCol + (this.camera.width / map.tsize);
//   var startRow = Math.floor(this.camera.y / map.tsize);
//   var endRow = startRow + (this.camera.height / map.tsize);
//   var offsetX = -this.camera.x + startCol * map.tsize;
//   var offsetY = -this.camera.y + startRow * map.tsize;

//   for (var c = startCol; c <= endCol; c++) {
//     for (var r = startRow; r <= endRow; r++) {
//       var tile = map.getTile(c, r);
//       var x = (c - startCol) * map.tsize + offsetX;
//       var y = (r - startRow) * map.tsize + offsetY;
//       if (tile !== 0) { // 0 => empty tile
//         this.ctx.drawImage(
// 	        graySq,
//         	Math.round(x),  // target x
//         	Math.round(y), // target y
//         	map.tsize, // target width
//         	map.tsize // target height
//         );
//       }
//     }
//   }
// };

Maverick._drawGrid = function () {
    var width = map.cols * map.tsize;
    var height = map.rows * map.tsize;
    var x, y;
    for (var r = 0; r < map.rows; r++) {
        x = - this.camera.x;
        y = r * map.tsize - this.camera.y;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
    }
    for (var c = 0; c < map.cols; c++) {
        x = c * map.tsize - this.camera.x;
        y = - this.camera.y;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
    }
};

Maverick.render = function () {
    // draw map background layer
    // this._drawLayer(0);
    this._drawGrid();
    drawPlane();
};





window.addEventListener("keydown", keypress_handler, false);

function drawPlane() {

    planeX += (speed * mod) * Math.sin(Math.PI / 180 * angle);
    planeY += -(speed * mod) * Math.cos(Math.PI / 180 * angle);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 180 * angle);
    ctx.drawImage(spitfire, -60, -60, 120, 120);
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