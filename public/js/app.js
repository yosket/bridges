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
				this.checkList.push(url);
				// while (this.checkList.length > 0) {
				for (var i = 0; i < 3; i++) {
					var t = this;
					console.log(this.checkList[i]);
					$q.all([this.check(this.checkList[i])]).then(function() {
						// angular.forEach(t.checkList, function(value, key) {
						// 	if (value === url) {
						// 		t.checkList.splice(key, 1);
						// 	}
						// });
						t.checkList.splice(i, 1);
						console.log(t.checkList.length);
					});
				}
			},
			check: function(url) {
				var d = $q.defer();
				var currentPage = {
					url: url,
					inner: []
				};
				this.message = url + 'を調査中 ...';
				var t = this;
				$http.get('api/', { params: { url: url } }).then(function(response) {
					var data = response.data;
					if (data.status) {
						angular.forEach(data.hrefs, function(href) {
							if (!isDuplicated(href, currentPage.inner)) {
								currentPage.inner.push({
									url: href,
									enabled: null
								});
							}
							if (href.indexOf(t.domain) === 0 && !isDuplicated(href, t.checkList)) {
								t.checkList.push(href);
							}
						});
						t.pages.push(currentPage);
						t.message = '';
					} else {
						t.message = data.message;
					}
					d.resolve();
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
