(function () {
	angular.module('meltdownAdmin', [])
		.controller('AdminCtrl', ['$http', '$timeout', '$scope', function ($http, $timeout, $scope) {
			const vm = this;
			vm.messages = 'disconnected';
			vm.tables = {};
			vm.username = '';

			vm.refreshTables = function () {
				return $http.get('/public/tables')
					.then(function (response) {
						vm.tables = (typeof response.data === 'string') ? JSON.parse(response.data) : response.data;
					})
					.catch(function (err) {
						vm.messages = 'Fetch error when refreshing tables: ' + (err && err.statusText ? err.statusText : err);
					});
			};

			vm.readyCount = function (users) {
				if (!users) return 0;
				return users.filter(function (u) { return u.ready; }).length;
			};

			let ws;
			vm.connectWebsocket = function () {
				const hostname = window.location.host;
				const scheme = document.location.protocol === 'http:' ? 'ws://' : 'wss://';

				function connect() {
					try {
						ws = new WebSocket(scheme + hostname + '/admin/meltdown');
					} catch (e) {
						vm.messages = 'WebSocket error: ' + e;
						$timeout(connect, 1000);
						return;
					}

					ws.onopen = function () {
						vm.messages = 'Connected to Meltdown, tables updated';
						$scope.$applyAsync();
						// vm.refreshTables();
					};

					ws.onmessage = function (event) {
						vm.messages = 'Update tables because: ' + event.data;
						$scope.$applyAsync();
						vm.refreshTables();
					};

					ws.onerror = function () { try { ws.close(); } catch (e) { } };

					ws.onclose = function () {
						vm.messages = 'Disconnected from Meltdown!';
						vm.tables = {};
						$scope.$applyAsync();
						$timeout(connect, 1000);
					};
				}

				connect();
			};

			vm.join = function () {
				if (!vm.username) return;
				$http.get('/admin/users/join?username=' + encodeURIComponent(vm.username))
					.then(function () { vm.refreshTables(); })
			};

			vm.loadFixtures = function () {
				$http.get('/admin/users/fixtures').
					then(function () { vm.refreshTables(); })
			};

			vm.clearTables = function () {
				$http.get('/admin/tables/clear').
					then(function () { vm.refreshTables(); })
			};

			vm.generateTables = function () {
				$http.get('/admin/tables/generate').
					then(function () { vm.refreshTables(); })
			};

			vm.reshuffleTables = function () {
				$http.get('/admin/tables/shuffle').
					then(function () { vm.refreshTables(); })
			};

			vm.notifyAll = function () {
				$http.get('/admin/notify').
					then(function () { })
			};

			vm.userDelete = function (username) {
				$http.get('/admin/users/delete?username=' + encodeURIComponent(username)).
					then(function () {
						vm.refreshTables();
					})
			};

			vm.userFinish = function (username) {
				$http.get('/admin/users/finish?username=' + encodeURIComponent(username)).
					then(function () {
						vm.refreshTables();
					})
			};

			vm.userReady = function (username) {
				$http.get('/admin/users/ready?username=' + encodeURIComponent(username)).
					then(function () {
						vm.refreshTables();
					})
			};

			vm.userNotReady = function (username) {
				$http.get('/admin/users/notready?username=' + encodeURIComponent(username)).
					then(function () {
						vm.refreshTables();
					})
			};
			vm.toggleCanPlayTarot = function (username) {
				$http.get('/admin/users/toggleCanPlayTarot?username=' + encodeURIComponent(username)).
					then(function () {
						vm.refreshTables();
					})
			};

			vm.toggleCanPlayTwoTables = function (username) {
				$http.get('/admin/users/toggleCanPlayTwoTables?username=' + encodeURIComponent(username)).
					then(function () {
						vm.refreshTables();
					})
			};


			vm.tableReady = function (table) {
				$http.get('/admin/tables/ready?table=' + encodeURIComponent(table)).
					then(function (response) {
						vm.refreshTables();
					})
			};
			vm.tableNotReady = function (table) {
				$http.get('/admin/tables/notready?table=' + encodeURIComponent(table)).
					then(function (response) {
						vm.refreshTables();
					})
			};
			vm.tableDelete = function (table) {
				$http.get('/admin/tables/delete?table=' + encodeURIComponent(table)).
					then(response => {
						vm.refreshTables();
					})
			};

			// init
			vm.connectWebsocket();
			vm.refreshTables();
		}]);
})();