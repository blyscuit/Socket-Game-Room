var app = angular.module('sampleApp', ['ui.bootstrap','ui.router','simpleControllers','btford.socket-io']);
app.factory('socket', function (socketFactory) {
  var myIoSocket = io.connect('http://localhost:8080');

  socket = socketFactory({
    ioSocket: myIoSocket
  });

  return socket;
});
// app.factory('socket', ['$rootScope', function($rootScope) {
//   var socket = io.connect();
//
//   return {
//     on: function(eventName, callback){
//       socket.on(eventName, callback);
//     },
//     emit: function(eventName, data) {
//       socket.emit(eventName, data);
//     }
//   };
// }]);
app.config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/")

  $stateProvider
      .state('lobby', {
            url: '/',
        templateUrl: '/partials/lobby.html',
        controller: 'LandingCtrl'
      })
      .state('lobby.main', {
        templateUrl: '/partials/lobby.main.html'
      })
      .state('lobby.join', {
        templateUrl: '/partials/lobby.join.html',
        controller: 'JoinCtrl'
      })
      .state('lobby.create', {
        templateUrl: '/partials/lobby.create.html',
        controller: "CreateCtrl"
      })
      .state('game', {
            url: '/game/:room/+',
        templateUrl: '/partials/game.html',
        controller: 'GameCtrl',
        params:{myParam: null}
      })
      .state('gameWait', {
            url: '/game/:room',
        templateUrl: '/partials/game.waiting.html',
        controller: 'GameWaitCtrl',
        params:{myParam: null}
      })
      .state('gameQuickJoin', {
            url: '/:room',
        templateUrl: '/partials/game.quickjoin.html',
        controller: 'GameQuickJoinCtrl',
        params:{myParam: null}
      })

  }]);
