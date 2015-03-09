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

// Connect to the server using socket.io
var socket = io.connect();

// User Props module to be able to pass aroudn user info 
app.service("userProps", function() {
  var user = { gameID: "", name: "", userID: -1 };
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
    startTimer();
    removeDrawer();
    if(userProps.getUser().name == "jeremy") {
      makeDrawer();
    }
    // TODO: upon load check to see if they have a name and if they are in the 
    // correct room

    // get the gameID and tell socket that you joined it
    userProps.getUser().gameID = $routeParams.id;

    socket.emit("joingame", userProps.getUser().gameID);

    // initialize variables
    $scope.text = "";
    $scope.messages = [];

    // upon receiving a message
    socket.on("message", function(message) {
      //console.log("received message");
      $scope.messages.push(message);
      $scope.$apply();
    });

    socket.on("clearTheScreen", function(data){
      console.log(data.name + " cleared the screen");
      stage.clear();
    });

    socket.on("newID", function(newID){
      userProps.getUser().userID = newID;
      console.log("Assigned new ID of " + newID);
    });

    socket.on("startTimer", function(){
      console.log("Server started timer");
    });

    socket.on("endTimer", function(){
      console.log("Server ended timer");
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
      socket.emit("sendMessage", {name: userProps.getUser().name, text: message, game: userProps.getUser().gameID});
    };

    // Code for clearing the screen
    $scope.clearScreen = function() {
      console.log("clicked clear screen");
      socket.emit("clearScreen", {name: userProps.getUser().name, game: userProps.getUser().gameID});
    };
  }
]);
