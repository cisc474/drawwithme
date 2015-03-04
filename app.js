// Import all necessary NodeJS modules
var http = require('http');
    path = require('path');
    socketio = require('socket.io');
    express = require('express');
    colors = require("colors/safe");

// Start express, the server, and socket.io
var router = express();
    server = http.createServer(router);
    io = socketio.listen(server);

// Set the static file path to the public directory
router.use(express.static(path.resolve(__dirname, "public")));

// Catch anything that tries to connect to the server and serve up the single
// page app located at public/index.html
router.get("/*", function(req, res) {
  res.sendFile(path.resolve(__dirname, "public/html/index.html"));
});

// Catch anything that might want to see all of the components that way in case 
// we need to change the above route this still prvents people from peeking
router.get("/components/*", function(req, res) {
  res.sendFile(path.resolve(__dirname, "public/index.html"));
});

//*** SOCKET IO STUFF ***//
// Begin the socket.io logic
// connection event is called for every new client thus this code occurs once for
// each client
io.sockets.on("connection", function(socket) {
  console.log("New client from " + colors.green(socket.request.connection.remoteAddress));

  // See when someone joins a new game add them to the socket "room"
  socket.on("joingame", function(gameID) {
    //console.log("joined game " + gameID);
    socket.join(gameID);
  });

  // When someone leave remove them from the socket "room"
  socket.on("leavegame", function(gameID) {
    //console.log("left game " + gameID);
    socket.leave(gameID);
  });

  // When someone sends a message emit it to the correct game
  socket.on("sendMessage", function(data) {
    //console.log("sending message..."  + data.game);
    io.sockets.in(data.game).emit("message", data);
  });

  // What to do when searching for a new game
  socket.on("lookingForGame", function(username) {
    //console.log("looking for a game...");
    // TODO: Check games 
    socket.emit("foundGame", "1");
  });

  socket.on("moved mouse", function(draw_packet) {
    console.log("DRAWING!");
    console.log(draw_packet);
    io.sockets.in(draw_packet.game).emit("update", draw_packet);
  });
});

// Start the server (taken from Andy which is taken from Cloud9)
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var address = server.address();
  console.log("Server is now started on ", address.address + ":" + address.port);
});

