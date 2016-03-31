var inSession = false;
var minPlayer = 1;
var maxPlayer = 8;
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

var gridWord;
var gridColor;

function updateAnnouncement (string) {
announcement = string;
io.sockets.emit('announcement', { message: announcement });
}
//role definitions, to be moved to a JSON file at some point in the near future
var roles = {
blue: {
	name: 'Blue Field Operative', //the role's reported name (ex: paranoid cops will still be named 'cop')
	group: 'Blue', //group players assigned the role are affiliated with
	power: false //does the role have any special actions at nighttime
},
red: {
	name: 'Red Field Operative',
	group: 'Red',
	power: false
},
redBoss: {
	name: 'Red Spymaster',
	group: 'Blue',
	power: true
},
blueBoss: {
	name: 'Blue Spymaster',
	group: 'Blue',
	power: true
},
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
// roles['blue'],
roles['blueBoss']
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
		players[i].emit('updatechat',"Game", 'You have been assigned the role of ' + playerRoles[i].name + '. So you ' + playerRoles[i].group + '.' );
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
	// if(inSession)return true;
	gridWord = new Array(5);
	for (var i = 0; i < 5; i++) {
	  gridWord[i] = new Array(5);
	}
	//for 400 words
	var bucket = [];

for (var i=0;i<=400;i++) {
    bucket.push(i);
}


for (var i = 0; i < 5; i++) {
	for (var j = 0; j < 5; j++) {
			 var randomIndex = Math.floor(Math.random()*bucket.length);
			 gridWord[i][j] =  words[bucket.splice(randomIndex, 1)[0]];
	}
}
console.log(gridWord);

	inSession = true;
	assignRoles();
	var livingPlayers = [];
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

var words = ['AFRICA',
'AGENT',
'AIR',
'ALIEN',
'ALPS',
'AMAZON',
'AMBULANCE',
'AMERICA',
'ANGEL',
'ANTARCTICA',
'APPLE',
'ARM',
'ATLANTIS',
'AUSTRALIA',
'AZTEC',
'BACK',
'BALL',
'BAND',
'BANK',
'BAR',
'BARK',
'BAT',
'BATTERY',
'BEACH',
'BEAR',
'BEAT',
'BED',
'BEIJING',
'BELL',
'BELT',
'BERLIN',
'BERMUDA',
'BERRY',
'BILL',
'BLOCK',
'BOARD',
'BOLT',
'BOMB',
'BOND',
'BOOM',
'BOOT',
'BOTTLE',
'BOW',
'BOX',
'BRIDGE',
'BRUSH',
'BUCK',
'BUFFALO',
'BUG',
'BUGLE',
'BUTTON',
'CALF',
'CANADA',
'CAP',
'CAPITAL',
'CAR',
'CARD',
'CARROT',
'CASINO',
'CAST',
'CAT',
'CELL',
'CENTAUR',
'CENTER',
'CHAIR',
'CHANGE',
'CHARGE',
'CHECK',
'CHEST',
'CHICK',
'CHINA',
'CHOCOLATE',
'CHURCH',
'CIRCLE',
'CLIFF',
'CLOAK',
'CLUB',
'CODE',
'COLD',
'COMIC',
'COMPOUND',
'CONCERT',
'CONDUCTOR',
'CONTRACT',
'COOK',
'COPPER',
'COTTON',
'COURT',
'COVER',
'CRANE',
'CRASH',
'CRICKET',
'CROSS',
'CROWN',
'CYCLE',
'CZECH',
'DANCE',
'DATE',
'DAY',
'DEATH',
'DECK',
'DEGREE',
'DIAMOND',
'DICE',
'DINOSAUR',
'DISEASE',
'DOCTOR',
'DOG',
'DRAFT',
'DRAGON',
'DRESS',
'DRILL',
'DROP',
'DUCK',
'DWARF',
'EAGLE',
'EGYPT',
'EMBASSY',
'ENGINE',
'ENGLAND',
'EUROPE',
'EYE',
'FACE',
'FAIR',
'FALL',
'FAN',
'FENCE',
'FIELD',
'FIGHTER',
'FIGURE',
'FILE',
'FILM',
'FIRE',
'FISH',
'FLUTE',
'FLY',
'FOOT',
'FORCE',
'FOREST',
'FORK',
'FRANCE',
'GAME',
'GAS',
'GENIUS',
'GERMANY',
'GHOST',
'GIANT',
'GLASS',
'GLOVE',
'GOLD',
'GRACE',
'GRASS',
'GREECE',
'GREEN',
'GROUND',
'HAM',
'HAND',
'HAWK',
'HEAD',
'HEART',
'HELICOPTER',
'HIMALAYAS',
'HOLE',
'HOLLYWOOD',
'HONEY',
'HOOD',
'HOOK',
'HORN',
'HORSE',
'HORSESHOE',
'HOSPITAL',
'HOTEL',
'ICE',
'ICE CREAM',
'INDIA',
'IRON',
'IVORY',
'JACK',
'JAM',
'JET',
'JUPITER',
'KANGAROO',
'KETCHUP',
'KEY',
'KID',
'KING',
'KIWI',
'KNIFE',
'KNIGHT',
'LAB',
'LAP',
'LASER',
'LAWYER',
'LEAD',
'LEMON',
'LEPRECHAUN',
'LIFE',
'LIGHT',
'LIMOUSINE',
'LINE',
'LINK',
'LION',
'LITTER',
'LOCH NESS',
'LOCK',
'LOG',
'LONDON',
'LUCK',
'MAIL',
'MAMMOTH',
'MAPLE',
'MARBLE',
'MARCH',
'MASS',
'MATCH',
'MERCURY',
'MEXICO',
'MICROSCOPE',
'MILLIONAIRE',
'MINE',
'MINT',
'MISSILE',
'MODEL',
'MOLE',
'MOON',
'MOSCOW',
'MOUNT',
'MOUSE',
'MOUTH',
'MUG',
'NAIL',
'NEEDLE',
'NET',
'NEW YORK',
'NIGHT',
'NINJA',
'NOTE',
'NOVEL',
'NURSE',
'NUT',
'OCTOPUS',
'OIL',
'OLIVE',
'OLYMPUS',
'OPERA',
'ORANGE',
'ORGAN',
'PALM',
'PAN',
'PANTS',
'PAPER',
'PARACHUTE',
'PARK',
'PART',
'PASS',
'PASTE',
'PENGUIN',
'PHOENIX',
'PIANO',
'PIE',
'PILOT',
'PIN',
'PIPE',
'PIRATE',
'PISTOL',
'PIT',
'PITCH',
'PLANE',
'PLASTIC',
'PLATE',
'PLATYPUS',
'PLAY',
'PLOT',
'POINT',
'POISON',
'POLE',
'POLICE',
'POOL',
'PORT',
'POST',
'POUND',
'PRESS',
'PRINCESS',
'PUMPKIN',
'PUPIL',
'PYRAMID',
'QUEEN',
'RABBIT',
'RACKET',
'RAY',
'REVOLUTION',
'RING',
'ROBIN',
'ROBOT',
'ROCK',
'ROME',
'ROOT',
'ROSE',
'ROULETTE',
'ROUND',
'ROW',
'RULER',
'SATELLITE',
'SATURN',
'SCALE',
'SCHOOL',
'SCIENTIST',
'SCORPION',
'SCREEN',
'SCUBA DIVER',
'SEAL',
'SERVER',
'SHADOW',
'SHAKESPEARE',
'SHARK',
'SHIP',
'SHOE',
'SHOP',
'SHOT',
'SINK',
'SKYSCRAPER',
'SLIP',
'SLUG',
'SMUGGLER',
'SNOW',
'SNOWMAN',
'SOCK',
'SOLDIER',
'SOUL',
'SOUND',
'SPACE',
'SPELL',
'SPIDER',
'SPIKE',
'SPINE',
'SPOT',
'SPRING',
'SPY',
'SQUARE',
'STADIUM',
'STAFF',
'STAR',
'STATE',
'STICK',
'STOCK',
'STRAW',
'STREAM',
'STRIKE',
'STRING',
'SUB',
'SUIT',
'SUPERHERO',
'SWING',
'SWITCH',
'TABLE',
'TABLET',
'TAG',
'TAIL',
'TAP',
'TEACHER',
'TELESCOPE',
'TEMPLE',
'THEATER',
'THIEF',
'THUMB',
'TICK',
'TIE',
'TIME',
'TOKYO',
'TOOTH',
'TORCH',
'TOWER',
'TRACK',
'TRAIN',
'TRIANGLE',
'TRIP',
'TRUNK',
'TUBE',
'TURKEY',
'UNDERTAKER',
'UNICORN',
'VACUUM',
'VAN',
'VET',
'WAKE',
'WALL',
'WAR',
'WASHER',
'WASHINGTON',
'WATCH',
'WATER',
'WAVE',
'WEB',
'WELL',
'WHALE',
'WHIP',
'WIND',
'WITCH',
'WORM',
'YARD']
