console.log('Maverick 2D!');

// ********************************************************************
// *************************** Maverick 2D ****************************
// ********************************************************************

// Global Variables

var socket = io();
console.log(socket);

var canvas = $('#canvas')[0];
var ctx = canvas.getContext('2d');
var player = {};
var planeX = 1280;
var planeY = 1280;
var angle = 0;
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

function Player(name, id) {
  this.name = name;
  this.id = id;
  this.planeX = 0;
  this.planeY = 0;
};

Camera.prototype.move = function(delta, camX, camY) {
	this.x = planeX - canvas.width / 2;
  this.y = planeY - canvas.height / 2;
}

function Maverick(context, camera, player) {
  this.ctx    = context;
  this.camera = camera;
  this.player = player;
}

// game = new Maverick(
//  canvas.getContext('2d'),
//  new Camera(map, canvas.width, canvas.height),
//  new Player("phil", "12345")
// );
//
// game.run();

Maverick.prototype.updateCam = function(delta) {
  this.camLeftBound   = planeX - (canvas.width / 2);
  this.camRightBound  = planeX + (canvas.width / 2);
  this.camTopBound    = planeY - (canvas.height / 2);
  this.camBottomBound = planeY + (canvas.height / 2);

  // TODO: store plane coords in a Player object
  // that is initialized along with the game (Maverick)
  // object
  var camX = planeX;
  var camY = planeY;
  this.camera.move(delta, camX, camY);
}

// ********************************************************************
// **************************** Game Stuff ****************************
// ********************************************************************

Maverick.prototype.run = function() {
  window.requestAnimationFrame(this.tick.bind(this));

  setInterval( () => {
    // console.log("Game:", game);

    if (bullets.length > 0) {
      console.log("Bullet:",    bullets[0]);
      console.log("CamBounds:", {
        camLeftBound:   this.camLeftBound
      , camRightBound:  this.camRightBound
      , camTopBound:    this.camTopBound
      , camBottomBound: this.camBottomBound
      });
    }
  }, 500);
};

// Maverick.prototype.requestAnimationFrame = window.requestAnimationFrame;

Maverick.prototype.tick = function(elapsed) {
  window.requestAnimationFrame(this.tick.bind(this));

  // clear previous frame
  this.ctx.clearRect(0, 0, 1280, 960);
  // render next frame
  this.render();
}

Maverick.prototype.render = function() {
  this.updateCam();
  this.drawGrid();
  this.drawEnemies();
  this.drawBullets();
  this.drawPlane();
};

// ********************************************************************
// *************************** Canvas Stuff ***************************
// ********************************************************************

Maverick.prototype.drawGrid = function () {
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

Maverick.prototype.drawPlane = function() {
  this.ctx.save();
  this.ctx.translate(canvas.width / 2, canvas.height / 2);
  this.ctx.rotate(Math.PI / 180 * angle);
  this.ctx.drawImage(spitfire, -60, -60, 120, 120);
  this.ctx.restore();
};

// Maverick.players = players;

Maverick.prototype.drawEnemies = function() {
  players.forEach((p) => {
    if (p.id !== player.id) {
      if (
         p.planeX < this.camRightBound
      && p.planeX > this.camLeftBound
      && p.planeY < this.camBottomBound
      && p.planeY > this.camTopBound
      ) {
        this.ctx.save();
        this.ctx.translate(p.planeX - this.camLeftBound, p.planeY - this.camTopBound);
        this.ctx.rotate(Math.PI / 180 * p.angle);
        this.ctx.drawImage(zero, -60, -60, 120, 120);
        this.ctx.restore();
      }
    }
  });
};

Maverick.prototype.drawBullets = function() {
  bullets.forEach((bullet) => {
    if (
      bullet.x < this.camRightBound  &&
      bullet.x > this.camLeftBound   &&
      bullet.y < this.camBottomBound &&
      bullet.y > this.camTopBound
    ) {
      this.ctx.save();
      this.ctx.translate(bullet.x - this.camLeftBound, bullet.y - this.camTopBound);
      this.ctx.rotate(Math.PI / 180 * bullet.angle);
      this.ctx.drawImage(bulletImg, -12, -12, 24, 24);
      this.ctx.restore();
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

  game = new Maverick(
    canvas.getContext('2d')
  , new Camera(map, canvas.width, canvas.height)
  // , new Player(playerSettings.name, playerSettings.id)
  );

  game.run();

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
