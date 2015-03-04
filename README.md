# Draw With Me!
This is a simple multiplayer app that is based on DrawSomething. The idea behind this app is that you can join a game where the objective is to guess what somebody is drawing. The first person to guess wins the round. There will be 2 times the amount of people rounds per game. The person with the highest number of round wins, wins the game. 

This app will use a NodeJS server that is running express and socket.io to listen to HTTP requests and open up channels between clients and the server. For the frontend of the application will use AngularJS, to display pages in a single-page app, and EaselJS to allow for fluid drawing on an HTML5 canvas.

* * *

### Installation

To run this application clone the repo to the machine you wish to run it on and then run `npm install` followed by `bower install` (install bower using `npm install -g bower`) to install all necessary NodeJS libraries and static dependencies. Then simply run `node app.js` to start the server.
