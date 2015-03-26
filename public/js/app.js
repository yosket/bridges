(function() {
	'use strict';

	var app = angular.module('app', []);

	app.factory('Website', function($q, $http) {
		return {
			top: '',
			pages: [],
			cache: [],
			message: '',
			current: 0,
			check: function(url) {
				this.set(url);
				this.crawl();
			},
			set: function(url) {
				this.top = url;
				this.pages.push({
					url: url,
					enabled: null,
					inner: []
				});
				this.message = url + ' の調査を開始';
			},
			crawl: function() {
				var self = this;
				self.message = self.pages[self.current].url + ' を調査中 ...';
				self.search(self.pages[self.current].url).then(function() {
					self.pages[self.current].enabled = true;
					self.current++;
					if (typeof self.pages[self.current] !== 'undefined') {
						self.crawl();
					}
				}, function() {
					self.pages[self.current].enabled = false;
					self.current++;
					if (typeof self.pages[self.current] !== 'undefined') {
						self.crawl();
					}
				});
			},
			search: function(url) {
				var self = this;
				var d = $q.defer();
				$http.get('api/', {
					params: {
						url: url,
						type: 'search'
					}
				}).then(function(response) {
					var data = response.data;
					if (data.status) {
						angular.forEach(data.hrefs, function(href) {
							if (!isDuplicated(href, self.pages[self.current].inner)) {
								self.pages[self.current].inner.push({
									url: href,
									enabled: null
								});
								var cached = false;
								angular.forEach(self.cache, function(cache) {
									if (cache.url === href) {
										cached = cache;
										return;
									}
								});
								var index = self.current;
								var innerIndex = self.pages[self.current].inner.length - 1;
								if (cached) {
									self.pages[index].inner[innerIndex].enabled = cached.enabled;
								} else {
									self.isAccessible(href).then(function(result) {
										self.pages[index].inner[innerIndex].enabled = result;
										self.cache.push({
											url: href,
											enabled: result
										});
									});
								}
							}
							var dFlg = false;
							angular.forEach(self.pages, function(item) {
								if (item.url === href) {
									dFlg = true;
								}
							});
							if (href.indexOf(self.top) === 0 && !dFlg && href.search(/(.jpg|.gif|.png)$/i) === -1) {
								self.pages.push({
									url: href,
									enabled: null,
									inner: []
								});
							}
						});
						self.message = '';
						d.resolve();
					} else {
						self.message = data.message;
						d.reject();
					}
				});
				return d.promise;
			},
			isAccessible: function(url) {
				var d = $q.defer();
				$http.get('api/', {
					params: {
						url: url,
						type: 'check'
					}
				}).then(function(response) {
					d.resolve(response.data.status);
				}, function() {
					d.reject();
				});
				return d.promise;
			}
		};
	});

	app.controller('AppController', ['$scope', 'Website', function AppController($scope, Website) {
		$scope.Website = Website;
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
