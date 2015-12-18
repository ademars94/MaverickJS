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

var mustang = new Image();
mustang.src = '/images/mustang.png';

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
  this.ctx.fillStyle = 'grey';
  this.ctx.fillText(client.name, 0, -72);
  this.ctx.rotate(Math.PI / 180 * this.client.angle);
  this.ctx.drawImage(spitfire, -60, -60, 120, 120);
  this.ctx.restore();
};

Maverick.prototype.drawEnemies = function() {
  if (players.length > 1) {
    players.forEach( (p) => {
      if (p.id !== this.client.id) {
        if (
           p.x < this.camRightBound
        && p.x > this.camLeftBound
        && p.y < this.camBottomBound
        && p.y > this.camTopBound
        ) {
          this.ctx.save();
          this.ctx.translate(p.x - this.camLeftBound, p.y - this.camTopBound);
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'bottom';
          this.ctx.font = "16px 'Lucida Grande'";
          this.ctx.fillStyle = 'red';
          this.ctx.fillText(p.name, 0, -72);
          this.ctx.rotate(Math.PI / 180 * p.angle);
          this.ctx.drawImage(zero, -60, -60, 120, 120);
          this.ctx.restore();
        }
      }
    });
  };
};

Maverick.prototype.drawBullets = function() {
  if (bullets.length >= 1) {
    bullets.forEach( (b) => {
      if (
        b.x < this.camRightBound  &&
        b.x > this.camLeftBound   &&
        b.y < this.camBottomBound &&
        b.y > this.camTopBound
      ) {
        this.ctx.save();
        this.ctx.translate(b.x - this.camLeftBound, b.y - this.camTopBound);
        this.ctx.rotate(Math.PI / 180 * b.angle);
        this.ctx.drawImage(bulletImg, -12, -12, 24, 24);
        this.ctx.restore();
      }
    });
  };
};

Maverick.prototype.setGlobal = function() {
  client = this.client
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

  console.log('Updated Settings:', updatedSettings);

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
  client.x = playerData.x;
  client.y = playerData.y;
  client.angle = playerData.angle;
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
  if (playerData.id === mav.client.id) {

    console.log('The client has been reset with these settings:', client);

    console.log('playerData:', playerData);
    console.log('Client:', mav.client);
    mav2 = new Maverick(
      canvas.getContext('2d')
      , new Camera(map, canvas.width, canvas.height)
      , client
      // , players
      // , bullets
    );
    console.log('Client After:', mav.client)

    mav.run();

    console.log(client.id + " has entered the game!");
    socket.emit('playAgain', mav.client);
  }
});
