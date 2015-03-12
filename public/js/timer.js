var timeRemaining;
var timer;
var min;
var sec;
var timerString;

// Connect to the server using socket.io
var socket = io.connect();

var startTimer = function(timerDuration) {
  
  timeRemaining = timerDuration;
  timer = $("#gameTimer").get(0);
  //console.log(timer);

  setInterval(function() {  

    if(timeRemaining < 0){
      //do code here when the game timer ends
      
    }
    timeRemaining = timeRemaining - 1000;
    //socket.emit("timer", { timeRemaining: timeRemaining });
//    console.log("insideinterval");

    min = (timeRemaining/1000/60) << 0;
    sec = (timeRemaining/1000) % 60;

    timerString = "Timer: " + min + ":";
    if(sec<10){
      timerString = timerString.concat("0" + sec);
    }else{
      timerString = timerString.concat(sec);
    }

    $("#gameTimer").html(timerString);
  }, 1000);// 1000 means it runs every second

  //not working yet
  socket.on('connection', function (socket) {  
    socket.on('reset', function (data) {
      timeRemaining = timerDuration;
      socket.emit('timer', { game: data.game, timerRemaining: timerRemaining });
    });
  });
}
