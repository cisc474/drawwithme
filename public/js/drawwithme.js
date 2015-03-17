// Create the angular app and inject the ngRoute module
var app = angular.module("drawwithme", ["ngRoute"]);

// Setup the routes used for the singlepage app
app.config(["$routeProvider", "$locationProvider",
  function($routeProvider, $locationProvider) {
    $routeProvider.when("/game/:id", {
      templateUrl: "/html/game.html",
      controller: "GameController"
    }).when("/home", {
      templateUrl: "/html/home.html",
      controller: "HomeController"
    }).otherwise({
      redirectTo: "/home"
    });
}]);

var scroll = function() {
	$("#chatMessageBox").animate({"scrollTop": $("#chatMessageBox")[0].scrollHeight}, "fast");
}
// Connect to the server using socket.io
var socket = io.connect();

// User Props module to be able to pass around user info
app.service("userProps", function() {
  var user = { gameID: "", name: "", userID: -1, isDrawer: false };
  return {
    getUser: function() {
      return user;
    },
    setUsername: function(value) {
      user.name = value;
    },
    setGameID: function(value) {
      user.gameID = value;
    },
    setUserID: function(value) {
      user.userID = value;
    },
    setIsDrawer: function(value) {
      user.isDrawer = value;
    }
  };
});

// This controller controls the Home screen
app.controller("HomeController", ["$scope", "$location", "userProps",
  function($scope, $location, userProps) {

    //socket.emit("leavegame", userProps.getUser().gameID);

    // Function called when a player wishes to join a game
    $scope.joinGame = function() {
      userProps.setUsername($scope.usernameInput);
      //console.log("Joining a game as " + userProps.getUser().name);
      socket.emit("lookingForGame", userProps.getUser().name);
    };

    socket.on("foundGame", function(userInfo) {
      var path = "/game/" + userInfo.gameID;
      userProps.setGameID(userInfo.gameID);
      userProps.setUserID(userInfo.userID);
      //console.log(userInfo.gameID);
      console.log("Users position is " + userInfo.userID);
      console.log("My current gameID is " + userProps.getUser().gameID);
      $location.path(path);
      $scope.$apply();
    });
  }
]);

// This controller controls the game view
app.controller("GameController", ["$scope", "$routeParams", "$location", "userProps",
  function($scope, $routeParams, $location, userProps) {
    var path = "/home";
    socket.emit("check", userProps.getUser());
    
    if(userProps.getUser().gameID.toString() == "") {
      //console.log("Nice Try");
      //console.log(userProps.getUser().gameID);
      $location.path(path);
      //$scope.$apply();
      return;
    }
    console.log(userProps.getUser());
    startDraw(userProps.getUser().gameID);
    //startTimer();
    removeDrawer();
    if(userProps.getUser().isDrawer) {
      makeDrawer();
    }

    // get the gameID and tell socket that you joined it
    //userProps.getUser().gameID = $routeParams.id;

    socket.emit("joingame", userProps.getUser().gameID);

    // initialize variables
    $scope.text = "";
    $scope.messages = [];

    // upon receiving a message
    socket.on("message", function(message) {
      //console.log("received message");
      $scope.messages.push(message);
      scroll();
      $scope.$apply();
    });

    socket.on("makeDrawer", function() {
      console.log("Server says I'm the drawer");
      console.log("Currently my gameID is " + userProps.getUser().gameID);
      userProps.getUser().isDrawer = true;
      makeDrawer();
    });

    socket.on("removeDrawer", function() {
      console.log("Server says I'm not the drawer :(");
      //console.log("Currently my gameID is " + userProps.getUser().gameID);
      userProps.getUser().isDrawer = false;
      removeDrawer();
    });

    socket.on("clearTheScreen", function(data){
      console.log(data.name + " cleared the screen");
      stage.clear();
    });

    socket.on("newID", function(newID){
      userProps.getUser().userID = newID;
      console.log("Assigned new ID of " + newID);
    });

    socket.on("startTimer", function(time){
      console.log("Server started timer");
      startTimer(time);
    });

    socket.on("endGame", function(){
      console.log("Server ended timer");
      killTimer();
    });

    socket.on("word", function(word){
      console.log("received word");
      alert("Your word is " + word);
    })

    socket.on("update", function(draw_packet) {
      if (stage.contains(title)) {
        stage.clear();
        stage.removeChild(title);
      }
      console.log("update received");
      drawingCanvas.graphics.clear().setStrokeStyle(draw_packet.stroke, 'round', 'round').beginStroke(draw_packet.color).moveTo(draw_packet.midPt.x, draw_packet.midPt.y).curveTo(draw_packet.oldPt.x, draw_packet.oldPt.y, draw_packet.oldMidPt.x, draw_packet.oldMidPt.y);
      stage.update();
    });

    socket.on("ping", function(){
      console.log("Ping received from server");
      socket.emit("pingrec", {gameID: userProps.getUser().gameID, userID: userProps.getUser().userID});
    });

    // What to do when sending a message
    $scope.sendMessage = function() {
      message = $scope.text;
      $scope.text = "";
      //console.log("sending message... " + message +", " + userProps.getUser().name + ", " + userProps.getUser().gameID);
      socket.emit("sendMessage", {name: userProps.getUser().name, text: message, game: userProps.getUser().gameID,
        userID: userProps.getUser().userID});
    };

    // Code for clearing the screen
    $scope.clearScreen = function() {
      console.log("clicked clear screen");
      socket.emit("clearScreen", {name: userProps.getUser().name, game: userProps.getUser().gameID});
    };

    // Code for changing draw color
    $scope.changeDrawColor = function(newColor) {
      console.log("color changed to: " + newColor);
      color = newColor;
      //going to have to emit the new color for the server to push out, to prevent any user from changing the color (only drawer should change)
      //also maybe have local user's color?
      //socket.emit("clearScreen", {name: userProps.getUser().name, game: userProps.getUser().gameID});
    };

    // Code for changing draw size
    $scope.changeDrawSize = function(newStroke) {
      console.log("size changed to: " + newStroke);
      stroke = newStroke;
      //going to have to emit the new color for the server to push out, to prevent any user from changing the color (only drawer should change)
      //also maybe have local user's color?
      //socket.emit("clearScreen", {name: userProps.getUser().name, game: userProps.getUser().gameID});
    };

    // Code for clearing the screen
    $scope.startGame = function() {
      console.log("Clicked the start game button");
      console.log("My game ID is " + userProps.getUser().gameID);
      if (userProps.getUser().isDrawer){
        socket.emit("startGame", userProps.getUser().gameID);
      }
      //going to have to emit the new color for the server to push out, to prevent any user from changing the color (only drawer should change)
      //also maybe have local user's color?
      //socket.emit("clearScreen", {name: userProps.getUser().name, game: userProps.getUser().gameID});
    };
  }
]);
