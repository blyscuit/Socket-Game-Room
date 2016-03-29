var inSession = false;
var minPlayer = 2;
var maxPlayer = 2;
function shuffle (array) {
var m = array.length, t, i;

while (m) {
	i = Math.floor(Math.random() * m--);

	t = array[m];
	array[m] = array[i];
	array[i] = t;
}

return array;
}

var announcement = '';

function updateAnnouncement (string) {
announcement = string;
io.sockets.emit('announcement', { message: announcement });
}
//role definitions, to be moved to a JSON file at some point in the near future
var roles = {
angel: {
	name: 'Red Teamer', //the role's reported name (ex: paranoid cops will still be named 'cop')
	group: 'Red team', //group players assigned the role are affiliated with
	power: false //does the role have any special actions at nighttime
},
death: {
	name: 'Blue Teamer',
	group: 'Blue team',
	power: false
}
};
//end role definitions

var header = '';

var roomname="";

var playersName = [];

function updateHeader (string) {
header = string;
io.sockets.emit('header', { message: header });
}
var playerRoles = [];

var playerRoles_default = [
roles['angel'],
roles['death']
];
playerRoles = playerRoles_default;
var players = [];
function assignRoles () {
var players = [];
// io.sockets.clients().forEach(function (socket) {
// 	players.push(socket);
// });
var clients = [];
var clients_in_the_room = io.sockets.adapter.rooms[roomname].sockets;
	for (var clientId in clients_in_the_room ) {
	var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
		// console.log('client: %s', client_socket); //Seeing is believing
		players.push(client_socket);
}

players = shuffle(players);
// console.log(players);

for (var i = 0; i < players.length; i++) {
	if (i <= playerRoles.length - 1) {
		players[i].game_alive = true;
		// players[i].join('alive');
		players[i].game_role = playerRoles[i];
		// players[i].join(playerRoles[i].group);
		players[i].emit('updatechat',"Game", 'You have been assigned the role of ' + playerRoles[i].name + '. You are affiliated with the ' + playerRoles[i].group + '.' );
	} else {
		players[i].game_alive = false;
		// players[i].join('spectator');
		players[i].emit('updatechat',"Game", 'Since the roles are full, you have been assigned the role of spectator.' );
	}
}
}

function hasEveryoneVoted () {
var votedFlag = true;

var clients_in_the_room = io.sockets.adapter.rooms[roomname].sockets;
	for (var clientId in clients_in_the_room ) {
	var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
		// console.log('client: %s', client_socket); //Seeing is believing
		if (!client_socket.game_hasVoted) {
			votedFlag = false;
		}
}
	// io.sockets.clients('alive').forEach(function (socket) {
	// 	if (!socket.game_hasVoted) {
	// 		votedFlag = false;
	// 	}
	// });

return votedFlag;
}

function compare(choice1, choice2) {
	if(choice1 === choice2) {
	return 0;
}
if(choice1 === "rock") {
	if(choice2 === "scissors") {
			return 1;
	} else {
			return 2;
	}
}
if(choice1 === "paper") {
	if(choice2 === "rock") {
			return 1;
	} else {
			if(choice2 === "scissors") {
					return 2;
	}
}
if(choice1 === "scissors") {
	if(choice2 === "rock") {
			return 2;
	} else {
			if(choice2 === "paper") {
					return 1;
			}
	}
}
}
};

function checkVictory () {
// 	var namespace = '/';
// for (var socketId in io.nsps[namespace].adapter.rooms[roomname]) {
// 	var socket = io.sockets.connected[socketId];
// 	console.log(socket);
// 	if(socket.game_hasVoted=="rock"){
// 		endGame(socket);
// 	}
// }
//
// 	var clients = io.sockets.adapter.rooms[roomname].sockets;
// 	console.log(clients[0]);
// 	if(clients[0].game_hasVoted=="rock"){
// 		endGame(clients[0]);
// 	}
// 	for (var i = 0; i < clients; i++) {
// 		clients[i]=null;
// 	}

var c = [];
var j=0;
var clients_in_the_room = io.sockets.adapter.rooms[roomname].sockets;
	for (var clientId in clients_in_the_room ) {
	var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
		console.log('client: %s vote %s', client_socket,client_socket.game_vote); //Seeing is believing
		c[j]=client_socket;
		client_socket.game_hasVoted = false;
		j++;
}
var answer = compare(c[0].game_vote,c[1].game_vote);
if(answer==0){
	// endGame("Tie");
	io.sockets.in(roomname).emit('updatechat',"Game", "Tie");
}else if(answer==1){
	// endGame(c[0]);
	io.sockets.in(roomname).emit('updatechat',"Game", c[0].username+ " won");
}else{
	// endGame(c[1]);
	io.sockets.in(roomname).emit('updatechat',"Game", c[1].username+ " won");
}


}

function endGameText (winner) {
updateHeader('Game over');
updateAnnouncement(winner + ' wins the game!');

}

module.exports = {

vote: function(socket, data) {

	data.username = socket.username;

	socket.game_hasVoted = true;

	socket.game_vote = data;

	if (hasEveryoneVoted()) {
		checkVictory();
	}
},

initialize:function () {
	inSession = true;
	assignRoles();
	var livingPlayers = [];
	// io.sockets.clients('alive').forEach(function (socket) {
	// 	livingPlayers.push(socket.game_nickname);
	// });
	//
	// //possibly replace this later with a point for injecting this kind of thing, I would like everything to be modular
	// if (wills) {
	// 	io.sockets.emit('updatechat', { message: 'This game session has wills enabled. Type /will to set yours.' });
	// 	io.sockets.clients('alive').forEach(function (socket) {
	// 		socket.game_will = '';
	// 	});
	// }

	io.sockets.in(roomname).emit('playerList', livingPlayers);
	return true;
},
setRoom:function (r) {
	roomname = r;
},
endGame:function(){
	inSession = false;
	io.sockets.in(roomname).emit('gameEnd', roomname);

},
getSesstion:function(){
	return inSession;
},
addPlayer: function(data) {
	playersName.push(data);
	io.sockets.in(roomname).emit('playerList', playersName,playersName.length>=minPlayer&&playersName.length<=maxPlayer);
},
removePlayer:function(data){
	var index = playersName.indexOf(data);    // <-- Not supported in <IE9
	if (index !== -1) {
		playersName.splice(index, 1);
	}
	io.sockets.in(roomname).emit('playerList', playersName,playersName.length>=minPlayer&&playersName.length<=maxPlayer);
},
returnPlayer:function(){
	io.sockets.in(roomname).emit('playerList',playersName,playersName.length>=minPlayer&&playersName.length<=maxPlayer);
}
};
