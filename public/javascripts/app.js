console.log('hello world');

var socket = io();
console.log(socket);

var canvas = $('#canvas')[0];
var ctx = canvas.getContext('2d');

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

function Camera(map, width, height) {
	this.x = 0;
	this.y = 0;
	this.width = width;
	this.height = height;
	this.maxX = map.cols * map.tsize - width;
	this.maxY = map.rows * map.tsize - height;
}

Camera.prototype.move = function(delta, dirX, dirY) {
	this.x += (speed * mod) * Math.sin(Math.PI / 180 * angle);
  this.y += -(speed * mod) * Math.cos(Math.PI / 180 * angle);
  this.x = Math.max(0, Math.min(this.x, this.maxX));
  this.y = Math.max(0, Math.min(this.y, this.maxY));
}

var x = canvas.width / 2;
var y = canvas.height / 2;
var speed = 5;
var angle = 0;
var mod = 1;

spitfire = new Image();
spitfire.src = '/images/spitfire.png';

window.addEventListener("keydown", keypress_handler, false);

var moveInterval = setInterval(function () {
    draw();
}, 30);

function draw() {
    ctx.clearRect(0, 0, 720, 480);

    x += (speed * mod) * Math.sin(Math.PI / 180 * angle);
    y += -(speed * mod) * Math.cos(Math.PI / 180 * angle);

    ctx.save();
    ctx.translate(x, y);
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