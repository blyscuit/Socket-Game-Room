var simpleControllers = angular.module('simpleControllers', []);
simpleControllers.controller('LobbyCtrl', function($state,$scope, socket) {
  $scope.newCustomers = [];
  $scope.currentCustomer = {};

  $scope.join = function() {
    socket.emit('sendchat', $scope.currentCustomer);
  };

  socket.on('updatechat', function(data,datadata) {
    $scope.$apply(function () {
      $scope.newCustomers.push(datadata);
      console.log(datadata);
    });
  });
});

simpleControllers.controller('GameCtrl', function($stateParams,$state,$scope, socket) {
  $scope.newCustomers = [];
  $scope.currentCustomer = {};

  $scope.activePlayer = $stateParams.myParam['activePlayer'];

  // alert($stateParams.myParamGame['room']);

  if(!$stateParams.myParam){
    // $state.go("lobby");
    $state.go('gameQuickJoin',{room:$stateParams.room});
  }

  $scope.join = function() {
    socket.emit('sendchat', $scope.currentCustomer);
  };

  $scope.gameAction = function(data){
      socket.emit('gamePress',data);
  };

  $scope.gameStart = function(){
      socket.emit('startGame',$stateParams.room);
  };

  socket.on('updatechat', function(data,datadata) {
    $scope.$apply(function () {
      $scope.newCustomers.push(datadata);
    //   $scope.messages.push({
    //   user: 'chatroom',
    //   text: 'User ' + data.name + ' has left.'
    // });
      console.log(datadata);
    });
  });
});

simpleControllers.controller('GameWaitCtrl', function($stateParams,$state,$scope, socket) {
  if(!$stateParams.myParam){
    // $state.go("lobby");
    $state.go('gameQuickJoin',{room:$stateParams.room});
  }
  $scope.roomName  = $stateParams.room;

  $scope.newCustomers = [];
  $scope.currentCustomer = {};

  // if(!$stateParams.myParam){
  //   $state.go("lobby");
  // }
  if($stateParams.myParam){
    socket.emit('checkPlayerInRoom',$stateParams.myParam['username'],$stateParams.room);
  }

  $scope.join = function() {
    socket.emit('sendchat', $scope.currentCustomer);
  };

  $scope.gameAction = function(data){
    // alert(data);
      socket.emit('gamePress',data);
  };

  $scope.gameStart = function(){
      socket.emit('startGame',$stateParams.room);
  };

  socket.on('receieveStartGame',function(data,datadata){
    $scope.$apply(function(){
      $state.go('game', { room: datadata,myParam:{username:data,activePlayer:true}});
    });
  });

  socket.on('playerList', function(data,dataBool) {
    $scope.$apply(function () {
      		$scope.newCustomers = data;
          $scope.roomOK = dataBool;
    });
  });

  socket.on('continueGame',function(newroom){
    $scope.$apply(function(){
      $state.go('game', { room: newroom,myParam:{username:$stateParams.myParam['username'],activePlayer:false}});
    });
  });

});

simpleControllers.controller('LandingCtrl', function($state,$scope, socket) {

  $state.go('lobby.main');

  $scope.joinView = function() {
    $state.go('lobby.join');
  };

  $scope.createView = function() {
    $state.go('lobby.create');
  };

  socket.on('updatechat', function(data,datadata) {
    $scope.$apply(function () {
      // $scope.newCustomers.push(datadata);
      console.log(datadata);
    });
  });
});

simpleControllers.controller('CreateCtrl', function($state,$scope, socket) {
  $scope.cancel = function() {
    $state.go('lobby.main');
  };


  $scope.createGame = function() {

    var v = Math.random().toString(36).slice(-5);
    socket.emit('createRoomWithUser',$scope.username, v);
  };

  socket.on('confirmCreate', function(data,datadata) {
    $scope.$apply(function () {
      $state.go('gameWait', { room:datadata,myParam:{username:data}});
    });
  });
});

simpleControllers.controller('JoinCtrl', function($state,$scope, socket) {
  $scope.cancel = function() {
    $state.go('lobby.main');
  };
  $scope.joinRoom = function() {
  socket.emit('joinRoomWithUser',$scope.username, $scope.roomID);
  };
  socket.on('confirmJoin', function(data,datadata) {
    $scope.$apply(function () {
      $state.go('gameWait', { room:datadata,myParam:{username:data}});
    });
  });
});

simpleControllers.controller('GameQuickJoinCtrl', function($stateParams,$state,$scope, socket) {
  $scope.roomName = $stateParams.room;
  $scope.cancel = function() {
    $state.go('lobby.main');
  };
  $scope.JoinRoom = function() {
  socket.emit('joinRoomWithUser',$scope.username, $stateParams.room);
  };
  socket.on('JoinRoom', function(data,datadata) {
    $scope.$apply(function () {
      $state.go('gameWait', { room:datadata,myParam:{username:data}});
    });
  });
  socket.on('confirmJoin', function(data,datadata) {
    $scope.$apply(function () {
      $state.go('gameWait', { room:datadata,myParam:{username:data}});
    });
  });
});
