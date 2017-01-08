var express = require("express")
var path = require("path")
var favicon = require("serve-favicon")
var logger = require("morgan")
var dgram = require("dgram")
var port = process.env.PORT || 3000

var routes = require("./routes/index")

var app = express()
var socket = dgram.createSocket("udp4")

var players = [];
var clients = {};

var Player = function(id, x, y, speed, angle) {
  this.id    = id
  this.x     = x
  this.y     = y
  this.speed = speed
  this.angle = angle
  this.turnDelta = 0
};

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, "public", "favicon.ico")))
app.use(logger("dev"))
app.use(express.static(path.join(__dirname, "public")))

app.use("/", routes)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found")
  err.status = 404
  next(err)
})

// Socket Stuff

function prettyLogMessage(address, port, client, timestamp, delta) {
  console.log("======================================================")
  console.log("----------------- " + address + ":" + port + " -----------------")
  console.log("======================================================")

  console.log("Client Id: " + client.id)
  console.log("Message Type: " + client.type)
  console.log("Client Timestamp: " + client.timestamp)
  console.log("Client Turn Delta X: " + client.turnDeltaX)

  console.log("\nServer Timestamp: " + timestamp)
  console.log("Delta: " + delta)

  console.log("***** " + "END" + " *****")
}

// ********************************************************************
// *************************** Move Logic *****************************
// ********************************************************************

var lastTime = Date.now()

function updateWorld() {
  var thisTime = Date.now()
  var delta = thisTime - lastTime

  if (delta >= 1000/20 && players.length > 0) {
    movePlayers()
    checkFPS()
    count()
    lastTime = thisTime
  }

  setImmediate(updateWorld)
}

var counter = 0
function count() {
  counter++
  // console.log("Counter:", counter)
}

function handlePlayerInput(client) {
  players.forEach(function(player) {
    if (player.id === client.id) {
      player.angle = client.angle
      checkPlayerPosition(player, client)
    }
  })
}

function killPlayer(client) {
  clients[client.id] = null
  players = players.filter(function(player) {
    return player.id !== client.id
  })

  console.log("Player Died!")
  console.log(players)
  console.log(clients)
}

function playerJoin(client, info) {

  client.address = info.address
  clients[client.id] = client

  var player = new Player(
    client.id,
    client.x,
    client.y,
    client.speed || 7,
    client.angle
  );

  players.push(player);

  console.log("Player Joined!")
  console.log(players)
  console.log(clients)
}

function movePlayers() {
  players.forEach(function(player) {
    var dx = player.x - (player.speed * 3) * Math.sin(Math.PI / 180 * player.angle)
    var dy = player.y + (player.speed * 3) * Math.cos(Math.PI / 180 * player.angle)

    if (dx >= -2048 && dx <= 2048) {
      player.x = dx
    }
    if (dy >= -2048 && dy <= 2048) {
      player.y = dy
    }
    // console.log(player)
  })
}

var lastFrame = Date.now()
var frameTime = 0
function checkFPS() {
  var thisFrame = Date.now()
  var delta = thisFrame - lastFrame
  frameTime += (delta - frameTime)

  fps = (1000 / frameTime)
  lastFrame = thisFrame
  console.log("FPS:", fps)
}

function checkPlayerPosition(player, client) {
  var dx = client.x - player.x
  var dy = client.y - player.y
  var da = client.angle - player.angle
  var margin = 10

  console.log("-------------------------")
  console.log("**** " + "BEGIN" + " ****")

  if (dx > margin || dx < -margin) {
    console.log("Delta X is     :", dx)
  }

  if (dy > margin || dy < -margin) {
    console.log("Delta Y is     :", dy)
  }

  if (da > margin || da < -margin) {
    console.log("Delta Angle is :", da)
  }

  // console.log("Delta X     :", dx)
  // console.log("Delta Y     :", dy)
  // console.log("------------------")
  // console.log("Delta Angle :", da)
  console.log("***** " + "END" + " *****")
  console.log("-------------------------")

}

socket.on('error', (err) => {
  console.log("ERROR:\n" + err.stack);
  socket.close();
});

socket.on('message', (msg, info) => {
  var client = JSON.parse(msg)

  var timestamp = new Date().getTime()
  var delta = client.timestamp - timestamp

  // prettyLogMessage(info.address, info.port, client, timestamp, delta)

  if (!clients[client.id] && client.type !== "die") {
    playerJoin(client, info)
  }

  if (client.type === "die") {
    killPlayer(client)
  }

  if (client.type === "input") {
    handlePlayerInput(client)
  }
});

socket.on('listening', () => {
  var address = socket.address();
  console.log("Listening on " + address.address + ":" + address.port + "...");
});

socket.bind(port);
setImmediate(updateWorld)

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500)
    res.render("error", {
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500)
  res.render("error", {
    message: err.message,
    error: {}
  })
})

module.exports = app
