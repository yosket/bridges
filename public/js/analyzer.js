var app = angular.module('app', []);

app.value('apiUrl', 'api/');

app.factory('pages', function() {
	var pages = [];
	return pages;
});

app.controller('AppCtrl', ['apiUrl', 'pages', '$scope', '$http', function AppCtrl(apiUrl, pages, $scope, $http) {
	$scope.pages = pages;
	$scope.check = function() {
		$scope.checking = true;
		pages.push({
			url: $scope.query,
			enabled: null
		});
		var api = apiUrl + '?url=' + encodeURIComponent($scope.query);
		$http.get(api).success(function(data) {
			$scope.status = data.status;
			if (data.status) {
				angular.forEach(pages, function(page) {
					if (page.url === $scope.query) {
						page.enabled = true;
					}
				});
				angular.forEach(data.hrefs, function(href) {
					var isDuplicated = false;
					angular.forEach(pages, function(page) {
						if (href === page.url) {
							isDuplicated = true;
						}
					});
					if (!isDuplicated) {
						pages.push({
							url: href,
							enabled: null
						});
					}
				});
			} else {
				$scope.message = data.message;
			}
			$scope.cheching = false;
		});
	};
}]);
