//Script that controls what happens player side

var ctx = document.getElementById("ctx").getContext("2d");
var canvas = document.getElementById("ctx");
var grassBlock = document.getElementById("grassBlock");
//var black = document.getElementById("black");//black square

var WIDTH = 500;
var HEIGHT = 500;

var mouseX = 0;
var mouseY = 0;

var buildMode = true;

let resizeCanvas = function(){
  WIDTH = window.innerWidth - 4;
  HEIGHT = window.innerHeight - 4;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  ctx.font = '30px Arial';
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
}
resizeCanvas();

window.addEventListener('resize',function(){
  resizeCanvas();
});


var socket = io();
var selfID = 0;
var indexSelf = 0;
var cameraPositionX = 0;
var cameraPositionY = 0;
var objOffsetX = 0;
var objOffsetY = 0;

socket.on('setID', function(playerID){
  selfID = playerID;
  console.log("New ID Set to: " + selfID);
});

ctx.font = '30px Arial';



//------------------Main Drawing Loop----------------//

socket.on('newPosition', function(data){
  ctx.clearRect(0,0,WIDTH,HEIGHT);

  drawBackround();

  for(var i = 0; i < data.length; i++){
    if (data[i].isPlayer){
      if (data[i].id == selfID){
        indexSelf = i;
      }
    }
  }
  //console.log("index self found at " + indexSelf);


    cameraPositionX = WIDTH / 2;
    cameraPositionY = HEIGHT / 2;

    objOffsetX = cameraPositionX - data[indexSelf].x;
    objOffsetY = cameraPositionY - data[indexSelf].y;

  for (var i = 0; i < data.length; i++){
    if (data[i].isPlayer){
      drawPlayer(data[i]);
    } else if (data[i].isBlock){
      drawBlock(data[i]);
    }
  }

  drawOnMouse();
  drawMode();

});
//---------------End of main drawing loop----------------------//

//--------------Drawing Backround of map--------------------//
function drawBackround(){
  ctx.fillStyle = 'rgb(148,229,255)';
  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );
}
//-------------End of draw Backround function--------------//

//-------------Draw Players Function--------------//
function drawPlayer(player){
  ctx.fillStyle = 'red';
  if (player.id != selfID){
    ctx.fillRect(
      (player.x - (player.width/2)) + objOffsetX,
      (player.y - (player.height/2)) + objOffsetY,
      player.width,
      player.height
    );
    ctx.fillText(player.id, player.x+player.width + objOffsetX, player.y + objOffsetY);
  } else {
    ctx.fillRect(
      cameraPositionX - (player.width/2),
      cameraPositionY - (player.height/2),
      player.width,
      player.height
    );
    ctx.fillText(player.id, cameraPositionX+player.width, cameraPositionY);
  }

  //ctx.fillText(player.id, player.x+player.width, player.y);
}
//--------End of Draw Players function----------//


//--------Draw Blocks Function-----------//
function drawBlock(block){
  ctx.fillStyle = 'black';
  // ctx.fillRect(
  //   (block.x - block.width/2) + objOffsetX,
  //   (block.y - block.height/2) + objOffsetY,
  //   block.width,
  //   block.height
  // );
  //ADD OTHER IMAGE FUNCTIONALITY
  ctx.drawImage(
    grassBlock,
    (block.x - block.width/2) + objOffsetX,
    (block.y - block.height/2) + objOffsetY,
    block.width,
    block.height
  );
}
//----------End of Draw Blocks Function------------//

//---------Draw on mouse function-----------//
function drawOnMouse(){
  ctx.fillRect(
    mouseX - 5,
    mouseY - 5,
    10,
    10
  )
}
//---------End of draw on mouse function---------//

function drawMode(){
  ctx.font = '50px serif';
  //ctx.fillText('Hello world', 50, 90);
  if (buildMode){
    ctx.fillText('Mode: Build', 10,50);
  } else {
    ctx.fillText('Mode: Attack', 10,50);
  }
}

document.onmousemove = function(mouse){
  mouseX = mouse.clientX;
  mouseY = mouse.clientY;
}


document.onkeydown = function(event) {
  if (event.keyCode === 68){      //d
    socket.emit('keyPress', {inputId:'right',state:true});
  } else if (event.keyCode === 83){//s
    socket.emit('keyPress', {inputId:'down',state:true});
  } else if (event.keyCode === 65){//a
    socket.emit('keyPress', {inputId:'left',state:true});
  } else if (event.keyCode === 87){//w
    socket.emit('keyPress', {inputId:'up',state:true});
  } else if (event.keyCode === 32){//space bar
    socket.emit('keyPress', {inputId:'jump',state:true});
  } else if (event.keyCode === 69){//space bar
    //socket.emit('keyPress', {inputId:'jump',state:true});
    if (buildMode){
      buildMode = false;
    } else {
      buildMode = true;
    }
  }
}

document.onkeyup = function(event) {
  if (event.keyCode === 68){      //d
    socket.emit('keyPress', {inputId:'right',state:false});
  } else if (event.keyCode === 83){//s
    socket.emit('keyPress', {inputId:'down',state:false});
  } else if (event.keyCode === 65){//a
    socket.emit('keyPress', {inputId:'left',state:false});
  } else if (event.keyCode === 87){//w
    socket.emit('keyPress', {inputId:'up',state:false});
  }
}
