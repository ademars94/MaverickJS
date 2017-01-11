var express = require("express")
var path = require("path")
var favicon = require("serve-favicon")
var logger = require("morgan")
var dgram = require("dgram")
var port = process.env.PORT || 1337

var routes = require("./routes/index")

var app = express()
var socket = dgram.createSocket({type: "udp4", reuseAddr: true})

var players = []
var clients = {}

var inputQueue = []

var Player = function(id, x, y, speed, angle) {
  this.id    = id
  this.x     = x
  this.y     = y
  this.speed = speed
  this.angle = angle
  this.turnDelta = 0
}

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
    sendUpdates()
    lastTime = thisTime
  }

  setImmediate(updateWorld)
}

var counter = 0
function count() {
  counter++
  // console.log("Counter:", counter)
}

function killPlayer(client) {
  clients[client.id] = null
  players = players.filter(function(player) {
    return player.id !== client.id
  })

  console.log("Player Died!")
  console.log(players)
  console.log(clients)

  // socket.close()
}

function playerJoin(client, address) {

  client.address = address
  clients[client.id] = client

  var player = new Player(
    client.id,
    client.x,
    client.y,
    client.speed || 7,
    client.angle
  );

  players.push(player);

  updateWorld()

  console.log("Player Joined!")
  console.log(players)
  console.log(clients)
}

function sendUpdates() {
  players.forEach(function(player) {
    var client = clients[player.id]
    var response = new Buffer(JSON.stringify(players))

    socket.send(
      response,
      0, // Buffer offset
      response.length,
      client.id,
      client.address,
      function(error, byteLength) {
        console.log( "Sent response to " + client.address + ":" + client.id + ".")
      }
    )
  })
}

function correctPlayerPosition(player, correction) {
  var client = clients[player.id]

  var response = new Buffer(JSON.stringify({ type: "correction", x: player.x, y: player.y, angle: player.angle }))
  socket.send(
    response,
    0, // Buffer offset
    response.length,
    client.id,
    client.address,
    function(error, byteLength) {
      console.log( "Sent response to " + client.address + ":" + client.id + ".")
    }
  )
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
  })
  // console.log(players)
  // console.log(clients)
}

function handlePlayerInput(client) {
  players.forEach(function(player) {
    if (player.id === client.id) {
      player.angle = client.angle
      checkPlayerPosition(player, client)
    }
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
  if (fps < 20) {
    console.log("FPS:", fps)
  }
}

function checkPlayerPosition(player, client) {
  var dx = client.x - player.x
  var dy = client.y - player.y
  var da = client.angle - player.angle
  var correcting = false
  var margin = 25

  if (dx > margin || dx < -margin) {
    correcting = true
  }

  if (dy > margin || dy < -margin) {
    correcting = true
  }

  if (da > margin || da < -margin) {
    correcting = true
  }

  if (correcting) {
    console.log("**** " + "BEGIN" + " ****")
    console.log("Delta X is     :", dx)
    console.log("Delta Y is     :", dy)
    console.log("Delta Angle is :", da)
    console.log("***** " + "END" + " *****")
    correctPlayerPosition(player)
    correcting = false
  }
}

socket.on('error', (err) => {
  console.log("ERROR:\n" + err.stack);
  socket.close()
})

socket.on('message', (msg, info) => {
  var client = JSON.parse(msg)

  var timestamp = new Date().getTime()
  var delta = client.timestamp - timestamp

  if (!clients[client.id] && client.type !== "die") {
    playerJoin(client, info.address)
  }

  if (client.type === "die") {
    killPlayer(client)
  }

  if (client.type === "input") {
    handlePlayerInput(client)
  }
})

socket.on('listening', () => {
  var address = socket.address()
  var foo = address.family
  console.log(foo + " socket listening on " + address.address + ":" + address.port + "...")
})

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
