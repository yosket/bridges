(function() {
	'use strict';

	var app = angular.module('app', []);

	app.factory('Website', ['$http', function($http) {
		var _domain, _pages, _message;
		var _init = function(domain) {
			_domain = domain;
			_pages = [];
			_message = '';
		};
		var _check = function(url) {
			_pages.push({
				url: url,
				enabled: null
			});
			_message = '通信中 ...';
			$http.get('api/', { params: { url: url } }).then(function(response) {
				var data = response.data;
				if (data.status) {
					angular.forEach(_pages, function(page) {
						if (page.url === url) {
							page.enabled = true;
						}
					});
					angular.forEach(data.hrefs, function(href) {
						var isDuplicated = false;
						angular.forEach(_pages, function(page) {
							if (href === page.url) {
								isDuplicated = true;
							}
						});
						if (!isDuplicated) {
							_pages.push({
								url: href,
								enabled: null
							});
						}
					});
					_message = '';
				} else {
					_message = data.message;
				}
			});
		};
		return {
			domain: _domain,
			pages: _pages,
			message: _message,
			init: _init,
			check: _check
		};
	}]);

	app.controller('AppController', ['$scope', 'Website', function AppController($scope, Website) {
		$scope.Website = Website;
		$scope.check = function() {
			var parser = new URL($scope.query);
			Website.init(parser.origin);
			Website.check($scope.query);
		};
		$scope.secondCheck = function() {
			Website.check($scope.secondQuery);
		};
	}]);

})();
