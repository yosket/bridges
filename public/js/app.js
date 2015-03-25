(function() {
	'use strict';

	var app = angular.module('app', []);

	app.factory('Website', function($q, $http) {
		return {
			domain: '',
			checkList: [],
			pages: [],
			message: '',
			checkStart: function(url) {
				var parser = new URL(url);
				this.domain = parser.origin;
				this.checkList.push({
					url: url,
					enabled: null
				});
				var index = 0;
				var self = this;
				var loop = function() {
					self.check(self.checkList[index].url).then(function() {
						self.checkList[index].enabled = true;
						index++;
						if (typeof self.checkList[index] !== 'undefined') {
							loop();
						}
					}, function() {
						self.checkList[index].enabled = false;
						index++;
						if (typeof self.checkList[index] !== 'undefined') {
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
							if (!isDuplicated(href, currentPage.inner)) {
								currentPage.inner.push({
									url: href,
									enabled: null
								});
							}
							var dFlg = false;
							angular.forEach(t.checkList, function(item) {
								if (item.url === href) {
									dFlg = true;
								}
							});
							if (href.indexOf(t.domain) === 0 && !dFlg && href.search(/(.jpg|.gif|.png)$/i) === -1) {
								t.checkList.push({
									url: href,
									enabled: null
								});
							}
						});
						t.pages.push(currentPage);
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
