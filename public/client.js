var socket = io.connect('http://localhost:8080');

  var room = "1";
  var gameInSession = false;
// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
  // call the server-side function 'adduser' and send one parameter (value of prompt)
  socket.emit('adduser', prompt("What's your name?"));
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
  $('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
  $('#conversation2').append('<b>'+username + ':</b> ' + data + '<br>');
});

// listener, whenever the server emits 'updaterooms', this updates the room the client is in
socket.on('updaterooms', function(rooms, current_room) {
  $('#rooms').empty();


  $.each(rooms, function(key, value) {
    if(value == current_room){
      $('#rooms').append('<div>' + value + '</div>');
      room = value;
    }
    else {
      $('#rooms').append('<div><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></div>');
    }
  });
  var v = Math.random().toString(36).slice(-5);
  $('#rooms').append('<div><a href="#" onclick="createRoom(\''+v+'\')">New Room\</a></div>');
});

socket.on("gameStart",function(current_room){
  if(room==current_room){
  $('#game').show();
  $('#lobby').hide();
  gameInSession = true;
}
});

socket.on("continueGame",function(current_room){
  // alert("fsdg");
  if(room==current_room){
  $('#game').show();
  $('#lobby').hide();
  gameInSession = true;
}
});

socket.on("gameEnd",function(current_room){
  if(room==current_room){
  $('#game').hide();
  $('#lobby').show();
  gameInSession = false;
}
});

function switchRoom(room){
  socket.emit('switchRoom', room);
}

function createRoom(room){
  socket.emit('createRoom', room);
}

// on load of page
$(function(){
  $('#game').hide();
  // when the client clicks SEND
  $('#datasend').click( function() {
    var message = $('#data').val();
    $('#data').val('');
    // tell server to execute 'sendchat' and send along one parameter
    socket.emit('sendchat', message);
  });

  // when the client hits ENTER on their keyboard
  $('#data').keypress(function(e) {
    if(e.which == 13) {
      $(this).blur();
      $('#datasend').focus().click();
    }
  });

  // when the client clicks Start
  $('#a').click( function() {
    if(gameInSession){
    // tell server to execute 'sendchat' and send along one parameter
      socket.emit('gamePress',"rock");
    }
  });

  // when the client clicks Start
  $('#b').click( function() {
    if(gameInSession){
    // tell server to execute 'sendchat' and send along one parameter
      socket.emit('gamePress',"paper");
    }
  });

  // when the client clicks Start
  $('#c').click( function() {
    if(gameInSession){
    // tell server to execute 'sendchat' and send along one parameter
      socket.emit('gamePress',"scissors");
    }
  });

  // when the client clicks Start
  $('#d').click( function() {
    if(gameInSession){
    // tell server to execute 'sendchat' and send along one parameter
      socket.emit('gamePress',"love");
    }
  });

  // when the client clicks Start
  $('#startGame').click( function() {
    if(room!="1"){
    // tell server to execute 'sendchat' and send along one parameter
      socket.emit('startGame',room);
    }
  });
});
