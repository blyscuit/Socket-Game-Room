var express = require('express');
var app = express()
, http = require('http')
, server = http.createServer(app)
// , io = require('socket.io').listen(server);
// var mongo = require('mongodb').MongoClient;
// server.listen(8080);
global.argv = require ('optimist')
.boolean('custom')
.boolean('debug')
.boolean('wills')
.alias('t', 'countdown')
.argv
;
var port = process.env.PORT || 8080;

global.io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

app.use("/", express.static(__dirname + '/public'));
// // routing
// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/public/');
// });
// // routing
// app.get('/about', function (req, res) {
//   res.sendfile(__dirname + '/public/about.html');
// });

// usernames which are currently connected to the chat
var usernames = {};

var games = {};

// rooms which are currently available in chat
var rooms = ['1'];

games['1']=require('./gameCodenames');
var CUSTOMCONNSTR_MONGOLAB_URI  = "mongodb://admin:admin@ds023428.mlab.com:23428/boardgames_db";
io.sockets.on('connection', function (socket) {

	// // when the client emits 'adduser', this listens and executes
	// socket.on('adduser', function(username){
	// 	// store the username in the socket session for this client
	// 	socket.username = username;
	// 	// store the room name in the socket session for this client
	// 	socket.room = 'room1';
	// 	// add the client's username to the global list
	// 	usernames[username] = username;
	// 	// send client to room 1
	// 	socket.join('room1');
	// 	// echo to client they've connected
	// 	socket.emit('updatechat', 'SERVER', 'you have connected to room1');
	// 	// echo to room 1 that a person has connected to their room
	// 	socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
	// 	socket.emit('updaterooms', rooms, 'room1');
	// });

	socket.on('createRoomWithUser', function(username,newRoom){
		newRoom = newRoom.toUpperCase();
		console.log(username+" creates");
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client

		// leave the current room (stored in session)
		socket.leave(socket.room);
		// join new room, received as function parameter
		socket.join(newRoom);
		socket.emit('updatechat', 'SERVER', 'you have created and connected to '+ newRoom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newRoom;
		socket.broadcast.to(newRoom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		rooms.push(newRoom);
		socket.emit('updaterooms', rooms, newRoom);
		console.log(newRoom+" created");


		// 		mongo.connect(CUSTOMCONNSTR_MONGOLAB_URI, function (err, db) {
		//     var collection = db.collection(newroom);
		//     collection.insert({"phase":0,"over":false}, function (err, o) {
		//         if (err) { console.warn(err.message); }
		//         else { console.log("newroom message inserted into db: " + newroom); }
		//     });
		// });


		var game = require('./gameCodenames');
		// console.log("game:"+newRoom.toUpperCase()+game);
		game.setRoom(newRoom);
		games[newRoom]=game;

				games[newRoom].addPlayer(username);

		socket.emit('confirmCreate', socket.username, newRoom);

	});
	socket.on('checkRoom', function(username,newroom){
		newroom = newroom.toUpperCase();
		console.log(games[newroom]+" room");
	});
	socket.on('checkPlayerInRoom', function(username,newroom){
		if(games[newroom]){
			games[newroom].returnPlayer();
		}
	});
	socket.on('joinRoomWithUser', function(username,newroom){
		newroom = newroom.toUpperCase();
		console.log(username+" join "+newroom);
		// store the username in the socket session for this client
		socket.username = username;

		// console.log(games[newroom]+" room");

		if(games[newroom]){
			var clients_in_the_room = io.sockets.adapter.rooms[socket.room];
			if(clients_in_the_room){
				if(clients_in_the_room.length==1&&games[socket.room]){
					games[socket.room].endGame();
					var index = rooms.indexOf(socket.room);
					if (index > -1) {
						rooms.splice(index, 1);
					}
				}
			}
			// leave the current room (stored in session)
			if(io.sockets.adapter.rooms[socket.room]){
				// var clients_in_the_room = io.sockets.adapter.rooms[socket.room].sockets;
				// var c ={};
				// for (var clientId in clients_in_the_room ) {
				// 	var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
				// 		c.push(datadata);
				// }
				games[socket.room].removePlayer(username);
				// socket.broadcast.to(socket.room).emit('updatePlayer', 'All', c);
			}
			socket.leave(socket.room);
			// join new room, received as function parameter
			socket.join(newroom);
			socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
			// sent message to OLD room
			// update socket session room title
			socket.room = newroom;

			// socket.broadcast.to(socket.room).emit('updatePlayer', 'All', c);

			games[newroom].addPlayer(username);

			socket.emit('updaterooms', rooms, newroom);
			console.log(games[newroom].getSesstion());
			if(games[newroom].getSesstion() == true){
				socket.emit('continueGame',newroom);
			}else{

			}

			var clients_in_the_room = io.sockets.adapter.rooms[newroom];
			console.log('client: %s', clients_in_the_room.length); //Seeing is believing


			socket.emit('confirmJoin', socket.username, newroom);
		}else{
			//room not yet created
			console.log(username+" join no room"+newroom);
		}
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
		console.log(socket.username);
	});

	socket.on('switchRoom', function(newroom){
		newroom = newroom.toUpperCase();
		var clients_in_the_room = io.sockets.adapter.rooms[socket.room];
		if(clients_in_the_room){
			if(clients_in_the_room.length==1&&games[socket.room]){
				games[socket.room].endGame();
				var index = rooms.indexOf(socket.room);
				if (index > -1) {
					rooms.splice(index, 1);
				}
			}
		}
		// socket.broadcast.to(socket.room).emit('updatePlayer', 'Remove', socket.username);

		games[socket.room].removePlayer(username);
		// leave the current room (stored in session)
		socket.leave(socket.room);
		// join new room, received as function parameter
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
		console.log(games[newroom].getSesstion());
		if(games[newroom].getSesstion() == true){
			socket.emit('continueGame',newroom);
		}else{

		}

		var clients_in_the_room = io.sockets.adapter.rooms[newroom];
		console.log('client: %s', clients_in_the_room.length); //Seeing is believing

	});

	socket.on('startGame', function(roomIn){

		io.sockets.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has start game in this room');
		// io.sockets.to(socket.room).emit('gameStart', socket.room);

		// mongo.connect(CUSTOMCONNSTR_MONGOLAB_URI, function (err, db) {
		// var collection = db.collection(socket.room);
		// collection.insert({"user":socket.username,"job":"",}, function (err, o) {
		//     if (err) { console.warn(err.message); }
		//     else { console.log("user message inserted into room: " + socket.username + " job"); }
		// });
		// });

		if(games[roomIn].initialize()==true){
			io.sockets.to(socket.room).emit('receieveStartGame', socket.username,socket.room);
		}

	});

	// 	socket.on('createRoom', function(newroom){
	// 		// leave the current room (stored in session)
	// 		socket.leave(socket.room);
	// 		// join new room, received as function parameter
	// 		socket.join(newroom);
	// 		socket.emit('updatechat', 'SERVER', 'you have created and connected to '+ newroom);
	// 		// sent message to OLD room
	// 		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
	// 		// update socket session room title
	// 		socket.room = newroom;
	// 		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
	// 		rooms.push(newroom);
	// 		socket.emit('updaterooms', rooms, newroom);
	// 		console.log(newroom+" created");
	//
	// // 		mongo.connect(CUSTOMCONNSTR_MONGOLAB_URI, function (err, db) {
	// //     var collection = db.collection(newroom);
	// //     collection.insert({"phase":0,"over":false}, function (err, o) {
	// //         if (err) { console.warn(err.message); }
	// //         else { console.log("newroom message inserted into db: " + newroom); }
	// //     });
	// // });
	//
	//
	//     var game = require('./gameRockPaperScissor');
	//     game.setRoom(newroom);
	//     games[newroom]=game;
	// 	});

	//when user choose action
	socket.on('gamePress', function(buttonName){
		games[socket.room].vote(socket, buttonName);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		var clients_in_the_room = io.sockets.adapter.rooms[socket.room];
		if(clients_in_the_room){
			if(clients_in_the_room.length==0&&games[socket.room]){
				games[socket.room].endGame();
				var index = rooms.indexOf(socket.room);
				if (index > -1) {
					rooms.splice(index, 1);
				}
			}
		}
		if(games[socket.room]){
					games[socket.room].removePlayer(socket.username);
				}
		delete usernames[socket.username];
		var tempRoom = socket.room;
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);

	});
});
