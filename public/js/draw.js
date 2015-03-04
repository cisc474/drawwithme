
var canvas, stage;
var drawingCanvas;
var oldPt;
var oldMidPt;
var title;
var color;
var stroke;
var colors;
var index;

var startDraw = function() {
  console.log("Hello from draw!");
  canvas = $("#gameCanvas").get(0);
  index = 0;
  colors = ["#000000"];
  //check to see if we are running in a browser with touch support
  stage = new createjs.Stage(canvas);
  stage.autoClear = false;
  stage.enableDOMEvents(true);
  createjs.Touch.enable(stage);
  createjs.Ticker.setFPS(24);
  drawingCanvas = new createjs.Shape();
  stage.addEventListener("stagemousedown", handleMouseDown);
  stage.addEventListener("stagemouseup", handleMouseUp);
  title = new createjs.Text("Click and Drag to draw", "36px Arial", "#777777");
  title.x = 300;
  title.y = 200;
  stage.addChild(title);
  stage.addChild(drawingCanvas);
  stage.update();
}

var handleMouseDown = function(event) {
  if (!event.primary) { return; }
  if (stage.contains(title)) {
    stage.clear();
    stage.removeChild(title);
  }
  color = colors[(index++) % colors.length];
  stroke = Math.random() * 30 + 10 | 0;
  oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
  oldMidPt = oldPt.clone();
  stage.addEventListener("stagemousemove", handleMouseMove);
}

var handleMouseMove = function(event) {
  if (!event.primary) { return; }
  var midPt = new createjs.Point(oldPt.x + stage.mouseX >> 1, oldPt.y + stage.mouseY >> 1);
  drawingCanvas.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

  var draw_packet = {color: color, stroke: stroke, midPt: midPt, oldPt: oldPt, oldMidPt: oldMidPt, game: "1"}
  socket.emit("moved mouse", draw_packet);

  oldPt.x = stage.mouseX;
  oldPt.y = stage.mouseY;
  oldMidPt.x = midPt.x;
  oldMidPt.y = midPt.y;
  stage.update();
}

var handleMouseUp = function(event) {
  if (!event.primary) { return; }
  stage.removeEventListener("stagemousemove", handleMouseMove);
}

var makeDrawer = function() {
  stage.addEventListener("stagemousedown", handleMouseDown);
  stage.addEventListener("stagemouseup", handleMouseUp);
}

var removeDrawer = function() {
  stage.removeEventListener("stagemousedown", handleMouseDown);
  stage.removeEventListener("stagemouseup", handleMouseUp);
}
