//---------This code here used to set up Express (send index.html file to client)----------//
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server Started");
//--------------End of express setup code----------------//

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var BLOCK_LIST = {};

var playerHeight = 100;
var playerWidth = 50;

var blockWidth = 100;
var blockHeight = 100;
var numBlocks = 0;

var gravity = true;
var gravSpeed = 1;

var Player = function(id){
  var self = {
    x:250,
    y:250,
    id:id,
    width:playerWidth,
    height:playerHeight,
    name:"Will",
    number:""+Math.floor(10*Math.random()),
    pressingRight:false,
    pressingLeft:false,
    pressingUp:false,
    pressingDown:false,
    maxSpd:5,
    verticalSpeed:0,
    maxVerticalSpeed:10
  }
  self.updatePosition = function(){
    if (self.pressingRight){
      self.x += self.maxSpd;
      if (self.checkCollisionPlayerAllBlocks()){
        self.x = self.x - self.maxSpd;
      }
    }
    // if (self.pressingUp){
    //   self.y -= self.maxSpd;
    // }
    if (gravity){
      if (self.verticalSpeed <= self.maxVerticalSpeed){//gravity functionality
        self.verticalSpeed = self.verticalSpeed + gravSpeed;
      }
      self.y += self.verticalSpeed;
      if (self.verticalSpeed >= 0){//checking for collision with player on top of block
        while (self.checkCollisionPlayerAllBlocks()){
          //self.y -= self.verticalSpeed;
          self.y -= 1;
        }
      } else {//checking for collision player hitting bottom of block
        while (self.checkCollisionPlayerAllBlocks()){
          self.y += 1;
          self.verticalSpeed = 0;
        }
      }
    }
    if (self.pressingLeft){
      self.x -= self.maxSpd;
      if (self.checkCollisionPlayerAllBlocks()){
        self.x = self.x + self.maxSpd;
      }
    }
  }

  self.checkCollisionPlayerAllBlocks = function(){
    for (var i in BLOCK_LIST){
      var block = BLOCK_LIST[i];
      if (self.checkCollisionPlayerBlock(block)){
        return true;
      }
    }
    return false;
  }//calls check single block fncn with all blocks
  self.checkCollisionPlayerBlock = function(block){
    var selfXTL = self.x - (self.width/2);
    var selfYTL = self.y - (self.height/2);
    var bXTL = block.x - (block.width/2);
    var bYTL = block.y - (block.height/2);

    if (selfXTL < bXTL + block.width &&
      selfXTL + self.width > bXTL &&
      selfYTL < bYTL + block.height &&
      selfYTL + self.height > bYTL) {
        return true;
    }
    return false;
  }//checks player against single block
  self.jump = function(){
    self.verticalSpeed = -25;
  }//function to make player jump

  return self;
}

var Block = function(id){
  var self = {
    name:'',
    x:250,
    y:300,
    id:id,
    height:blockHeight,
    width:blockWidth
  }
  return self;
}

// var bottomBlock = Block(numBlocks);
// numBlocks = numBlocks + 1;
// BLOCK_LIST[0] = bottomBlock;
// BLOCK_LIST[0].y = 400;

function addBlock(name, x, y, height, width){
  var block = Block(numBlocks);
  block.x = x;
  block.y = y;
  block.name = name;
  block.height = height;
  block.width = width;
  BLOCK_LIST[numBlocks] = block;
  numBlocks = numBlocks + 1;
}//adds a block to BLOCK LIST

addBlock('grass', 0, 0, blockHeight, blockWidth);
addBlock('grass', 0, 2*blockWidth, blockHeight, blockWidth);

addBlock('floor', 0, 5*blockWidth, 100, 10000);

var io = require('socket.io')(serv,{});
//main io connection and key detection function
io.sockets.on('connection', function(socket){//called when player connects with server
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;//adding player socket to list
  //console.log('socket connection');

  var player = Player(socket.id);
  console.log("New Player with ID: " + socket.id);
  PLAYER_LIST[socket.id] = player;

  SOCKET_LIST[socket.id].emit('setID', socket.id);//emmitting id of player, used for centering camera


  socket.on('disconnect',function(){//called when player disconnects from server
    console.log("Player Disconnected with ID: " + socket.id);
    delete SOCKET_LIST[socket.id];//deleting player's socket from list
    delete PLAYER_LIST[socket.id];
  });

  socket.on('keyPress',function(data){//called when player presses a key
    if(data.inputId === 'left'){
      player.pressingLeft = data.state;
    } else if (data.inputId === 'right'){
      player.pressingRight = data.state;
    } else if (data.inputId === 'up'){
      player.pressingUp = data.state;
    } else if (data.inputId === 'down'){
      player.pressingDown = data.state;
    } else if (data.inputId === 'jump'){
      player.jump();
    }
  });
});

setInterval(function(){//game loop
  var pack = [];//pack to transfer data
  for (var i in PLAYER_LIST){
      var player = PLAYER_LIST[i];
      player.updatePosition();
      pack.push({
        x:player.x,
        y:player.y,
        id:player.id,
        height:player.height,
        width:player.width,
        number:player.number,
        isPlayer:true,
        isBlock:false
      });
  }

  for (var i in BLOCK_LIST){
    var block = BLOCK_LIST[i];
    pack.push({
      x:block.x,
      y:block.y,
      height:block.height,
      width:block.width,
      isPlayer:false,
      isBlock:true
    });
  }

  for (var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
    socket.emit('newPosition',pack);
  }
}, 1000/100);
