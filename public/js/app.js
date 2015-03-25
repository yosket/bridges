(function() {
	'use strict';

	var app = angular.module('app', []);

	app.factory('Website', function($q, $http) {
		return {
			domain: '',
			pages: [],
			message: '',
			index: 0,
			checkStart: function(url) {
				var parser = new URL(url);
				this.domain = parser.origin;
				this.pages.push({
					url: url,
					enabled: null,
					inner: []
				});
				var self = this;
				var loop = function() {
					self.check(self.pages[self.index].url).then(function() {
						self.pages[self.index].enabled = true;
						self.index++;
						if (typeof self.pages[self.index] !== 'undefined') {
							loop();
						}
					}, function() {
						self.pages[self.index].enabled = false;
						self.index++;
						if (typeof self.pages[self.index] !== 'undefined') {
							loop();
						}
					});
				};
				loop();
			},
			check: function(url) {
				var d = $q.defer();
				var currentPage = {
					url: url,
					inner: []
				};
				this.message = url + 'を調査中 ...';
				var t = this;
				$http.get('api/', {
					params: {
						url: url,
						type: 'search'
					}
				}).then(function(response) {
					var data = response.data;
					if (data.status) {
						angular.forEach(data.hrefs, function(href) {
							if (!isDuplicated(href, t.pages[t.index].inner)) {
								t.pages[t.index].inner.push({
									url: href,
									enabled: null
								});
							}
							var dFlg = false;
							angular.forEach(t.pages, function(item) {
								if (item.url === href) {
									dFlg = true;
								}
							});
							if (href.indexOf(t.domain) === 0 && !dFlg && href.search(/(.jpg|.gif|.png)$/i) === -1) {
								t.pages.push({
									url: href,
									enabled: null,
									inner: []
								});
							}
						});
						t.message = '';
						d.resolve();
					} else {
						t.message = data.message;
						d.reject();
					}
				});
				return d.promise;
			}
		};
	});

	app.controller('AppController', ['$scope', 'Website', function AppController($scope, Website) {
		$scope.Website = Website;
		$scope.check = function() {
			Website.checkStart($scope.query);
		};
		$scope.reload = function() {
			location.reload();
		}
	}]);

	var isDuplicated = function(str, array) {
		var duplicated = false;
		angular.forEach(array, function(value) {
			if (value === str) {
				duplicated = true;
			}
		});
		return duplicated;
	}

})();
