console.log('Maverick 2D!');

// ********************************************************************
// *************************** Maverick 2D ****************************
// ********************************************************************

// Global Variables

var socket = io();
console.log(socket);

var canvas = $('#canvas')[0];
var ctx = canvas.getContext('2d');
var client;
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
    socket.emit('leftPressed', mav.client);
  }
  if (event.keyCode == 68 || event.keyCode == 39) {
    socket.emit('rightPressed', mav.client);
  }
  if (event.keyCode == 16) {
    socket.emit('shiftPressed', mav.client);
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
};

Camera.prototype.move = function(delta, camX, camY) {
  // debugger;
	this.x = mav.client.x - canvas.width / 2;
  this.y = mav.client.y - canvas.height / 2;
};

// ********************************************************************
// **************************** Game Stuff ****************************
// ********************************************************************

function Client(name, id, x, y, angle, health) {
  this.name = name;
  this.id = id;
  this.x = x;
  this.y = y;
  this.angle = angle;
  this.health = health;
};

function Maverick(context, camera, client, players, bullets) {
  this.ctx    = context;
  this.camera = camera;
  this.client = client;
  this.players = players;
  this.bullets = bullets;
}

Maverick.prototype.updateCam = function(delta) {
  this.camLeftBound   = mav.client.x - (canvas.width / 2);
  this.camRightBound  = mav.client.x + (canvas.width / 2);
  this.camTopBound    = mav.client.y - (canvas.height / 2);
  this.camBottomBound = mav.client.y + (canvas.height / 2);
  this.camera.move(mav.client.x, mav.client.y);
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
  this.render();
}

Maverick.prototype.render = function() {
  this.updateCam();
  this.drawGrid();
  if (Maverick.players.length) {
    this.drawEnemies();
  }
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
  this.ctx.rotate(Math.PI / 180 * mav.client.angle);
  this.ctx.drawImage(spitfire, -60, -60, 120, 120);
  this.ctx.restore();
};

Maverick.prototype.drawEnemies = function() {
  Maverick.players.forEach( (p) => {
    if (p.id !== mav.client.id) {
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
  Maverick.bullets.forEach((bullet) => {
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
  client = new Client($('#name').val(), socket.id);
  console.log(client);
  socket.emit('respawn', client);
});

// ********************************************************************
// *************************** Socket Stuff ***************************
// ********************************************************************

socket.on('joinGame', function (updatedSettings) {
  var context = canvas.getContext('2d');

  console.log(updatedSettings);

  mav = new Maverick(
    canvas.getContext('2d')
    , new Camera(map, canvas.width, canvas.height)
    , new Client(updatedSettings.name
    , updatedSettings.id
    , updatedSettings.x
    , updatedSettings.y
    , updatedSettings.angle
    , updatedSettings.health)
    // , players
    // , bullets
  );
  console.log(mav.client)
  $('#menu').hide();

  mav.run();

  console.log(client.id + " has entered the game!");
});

socket.on('movePlane', function(playerData) {
  mav.client.x = playerData.planeX;
  mav.client.y = playerData.planeY;
  mav.client.angle = playerData.angle;
});

socket.on('playerHit', function(playerData) {
  console.log(playerData.name, 'has been hit!');
});

socket.on('moveBullets', function(bulletData) {
  Maverick.bullets = bulletData;
});

socket.on('updateAllPlayers', function(otherPlayers) {
  Maverick.players = otherPlayers;
});

socket.on('shotFired', function(playerData) {
  console.log(playerData.name, 'is firing!');
});

socket.on('playerDie', function(playerData) {
  console.log(playerData.name, 'was shot down!');
  if (playerData.id === mav.client.id) {
    var context = canvas.getContext('2d');

    console.log('playerData:', playerData);
    console.log('Client:', mav.client);

    mav = new Maverick(
      canvas.getContext('2d')
      , new Camera(map, canvas.width, canvas.height)
      , new Client(playerData.name
      , playerData.id
      , 1280
      , 1280
      , 0
      , 1)
      // , players
      // , bullets
    );
    console.log('Client After:', mav.client)

    mav.run();

    console.log(client.id + " has entered the game!");
    socket.emit('playAgain', mav.client);
  }
});
