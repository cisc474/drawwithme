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

var MAX_PLAYERS = 6;
var games = [];
var listening = false; // Are we listening for pings right now?
var wordListener = false;

var TIME_DELAY = 3000; // Time delay when pinging, in ms
var TIMER = 15000; // Timer for a game, in ms
var words = ["boat", "smile", "guitar", "table", "computer", "turkey", "tree", "lion", "flower"];

// Creates a new game, adds to list of games
function Game(){
  this.gameID = games.length;
  this.numPlayers = 0;
  this.players = [];
  this.wordCounter = 0; // Could do random but I don't feel like it.
  this.drawer = 0;
  this.gameState = 0; // 0: inactive, 1: active, 2: Waiting for start? Something else idk
  console.log("Created Game " + this.gameID);
}

// Shortens array of users, keeping the same order
function shortenArray(users){
  var numRealValues = 0;
  var returnArray = [];
  for (var i = 0; i < users.length; i++){
    if (users[i].inGame){
      returnArray[numRealValues] = users[i];
      returnArray[numRealValues].userID = numRealValues;
      numRealValues++;
    }
    else console.log(i + "isn't here anymore");
  }
  console.log(returnArray.length + " real users left.");
  return returnArray;
}

// Creates a player
function Player(socket, username){
  this.username = username;
  this.userSocketID = socket.id; // Need to keep track of each users socket
  this.inGame = true;
  console.log("Users created with socketID " + this.userSocketID);
}

// Creates and adds a player to the first open game in the list of games.
// Stores the user's socket with the user
function addPlayer(socket, username){
  //console.log(this);
  var player = new Player(socket, username);
  for (var i = 0; i < games.length; i++){
    if (games[i].numPlayers < MAX_PLAYERS){
      player.userID = games[i].numPlayers;
      //console.log(games[i].players.length + " players here before I joined");
      // for (var j = 0; j < games[i].players.length; j++){
      //   console.log("User with ID " + games[i].players[j].userID + " Added with socketID " + games[i].players[j].userSocketID);
      // }
      games[i].players[games[i].players.length] = player;
      for (var j = 0; j < games[i].players.length; j++){
        console.log("User with ID " + games[i].players[j].userID + " Added with socketID " + games[i].players[j].userSocketID);
      }
      games[i].numPlayers++;
      //console.log(games[i].players[players.length - 1]);
      var word = words[player.wordCounter];
      socket.emit("foundGame", {gameID: i, userID: player.userID});
      return;
    }
  }
  var game = new Game();
  player.userID = 0;
  game.players[0] = player;
  game.numPlayers++;
  games[games.length] = game;
  var word = words[player.wordCounter];
  socket.emit("foundGame", {gameID: games.length - 1, userID: player.userID});
}

// checks the number of users in a game by pinging them and
// waiting for responses. Reorganizes users, keeping them in their
// same order
function checkGame(socket, gameID){
  var origUsers = games[gameID].players;
  console.log("Orig Users is of length " + origUsers.length);
  listening = true; // Listening now for pingrec events
  for (var i = 0; i < origUsers.length; i++){
    games[gameID].players[i].inGame = false; // They're not here until they say they are
    console.log("Sending message to " + games[gameID].players[i].userSocketID);
    io.to(games[gameID].players[i].userSocketID).emit("ping");
  }
  //io.sockets.in(gameID).emit("ping"); // Head count

  setTimeout(function() {
    listening = false; // No longer listening
    console.log('Waited the 3 seconds');
    games[gameID].numPlayers = games[gameID].players.length;
    games[gameID].players = shortenArray(games[gameID].players);
    //games[gameID].players = origUsers;
    for (var i = 0; i < games[gameID].players.length; i++){
      io.to(games[gameID].players[i].userSocketID).emit("newID", i);
    }
    // To do: Send back userID to users. 
    return;
  }, TIME_DELAY);
  // Anything you put down here won't wait until after the three seconds. 
}

// Sends a word to the appropriate user. Could shorten to one (exceedingly long)
// line if you'd like to. 
function sendWord(gameID){
  var game = games[gameID];
  var numPlayers = game.players.length;
  var word = words[game.drawer % words.length];
  io.to(games[gameID].players[game.drawer % numPlayers].userSocketID).emit("word", word);
}

/*
Starts (end later ends) the game timer for a specific game.
*/
function startTimer(gameID){
  var users = games[gameID].players;
  var game = games[gameID];
  var numPlayers = game.players.length;
  for (var i = 0; i < games[gameID].players.length; i++){
    io.to(games[gameID].players[i].userSocketID).emit("startTimer");
  }
  console.log("Started Timer, sent word to " + colors.red(game.players[game.drawer % numPlayers].username));
  sendWord(gameID);
  wordListener = true; // We are now actively listening for the word. 
  //io.sockets.in(gameID).emit("ping"); // Head count

  setTimeout(function() {
    console.log("Timer is over");
    if (wordListener){ // We have to check in case someone gets it right before the timer ends
      for (var i = 0; i < games[gameID].players.length; i++){
        io.to(games[gameID].players[i].userSocketID).emit("endTimer");
      }
      wordListener = false;
      games[gameID].drawer++;
      games[gameID].wordCounter++;
      return;
    }
  }, TIMER);
  // Anything you put down here won't wait until after the three seconds. 
}



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

  socket.on("pingrec", function(userInfo){
    //console.log("numUsers = " + numUsers);
    console.log("User pinged with ID " + userInfo.userID);
    if (listening && games[userInfo.gameID].players[userInfo.userID]){
      games[userInfo.gameID].players[userInfo.userID].inGame = true; // We still have this user
    }
  });

  // When someone leave remove them from the socket "room"
  socket.on("leavegame", function(gameID) {
    console.log("left game " + gameID);
    socket.leave(gameID);
    games[gameID].players = shortenArray(games[gameID].players);
  });

  // When someone sends a message emit it to the correct game
  socket.on("sendMessage", function(data) {
    //console.log("sending message..."  + data.game);
    io.sockets.in(data.game).emit("message", data);
    //checkGame(socket, 0);
    if (wordListener) {
      if(data.text == words[games[data.game].wordCounter % words.length]){
        console.log(colors.blue("Someone got it right"));
        wordListener = false;
      }
    }
    else {
      startTimer(0);
    }
  });

  //Clears the drawing screen in the game that called clear screen
  socket.on("clearScreen", function(data){
    console.log("in clear screen event");
    io.sockets.in(data.game).emit("clearTheScreen", data);
  });

  //Called when dealing with timer stuff
  socket.on("timer", function(data){
   // console.log("timer: " + data.timeRemaining);
  });

  // What to do when searching for a new game
  socket.on("lookingForGame", function(username) {
    //console.log("looking for a game...");
    // TODO: Check games 
    addPlayer(socket, username);
  });

  socket.on("moved mouse", function(draw_packet) {
    //console.log("DRAWING!");
    console.log(draw_packet);
    io.sockets.in(draw_packet.game).emit("update", draw_packet);
  });
});

// Start the server (taken from Andy which is taken from Cloud9)
server.listen(process.env.PORT || 3100, process.env.IP || "0.0.0.0", function() {
  var address = server.address();
  console.log("Server is now started on ", address.address + ":" + address.port);
});

