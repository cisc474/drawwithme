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

// This controller controls the Home screen
app.controller("HomeController", ["$scope", 
  function($scope) {

    // Function called when a player wishes to join a game
    $scope.joinGame = function() {
      console.log("Joining a game...");
    };
  }
]);

// Theis controller controls the game view
app.controller("GameController", ["$scope", "$routeParams", 
  function($scope, $routeParams) {
    // get the gameID and tell socket that you joined it
    gameID = $routeParams.id;

    socket.emit("joingame", gameID);

    // initialize variables
    name = "dummy";
    $scope.text = "";
    $scope.messages = [];

    // upon receiving a message
    socket.on("message", function(message) {
      //console.log("received message");
      $scope.messages.push(message);
      $scope.$apply();
    });

    // What to do when sending a message
    $scope.sendMessage = function() {
      message = $scope.text;
      $scope.text = "";
      //console.log("sending message... " + message +", " + name + ", " + gameID); 
      socket.emit("sendMessage", {name: name, text: message, game: gameID});
    };
  }
]);
