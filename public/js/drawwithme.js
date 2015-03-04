// Create the angular app and inject the ngRoute module
var app = angular.module("drawwithme", ["ngRoute"]);

// Setup the routes used for the singlepage app
app.config(["$routeProvider", "$locationProvider", 
  function($routeProvider, $locationProvider) {

    // The default page to be shown when a client connects
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
app.controller("GameController", ["$scope", "$routeParams" 
  function($scope, $routeParams) {
    $scope.messages = [];

    // What to do when sending a message
    $scope.sendMessage = function() {
      $scope.text = "";
    };
  }
]);
