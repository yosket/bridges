'use strict';

app.controller('AppController', ['$scope', 'Website', function AppController($scope, Website) {

	// 画面の表示領域調整
	var headerHeight, footerHeight;
	var setHeight = function(selectors) {
		var winHeight = document.documentElement.clientHeight;
		if (!headerHeight) {
			headerHeight = document.getElementById('header').clientHeight;
		}
		if (!footerHeight) {
			footerHeight = document.getElementById('footer').clientHeight;
		}
		var displayHeight = winHeight - headerHeight - footerHeight;
		angular.forEach(selectors, function(selector) {
			angular.element(document.querySelectorAll(selector)).css('height', displayHeight + 'px');
		});
	};
	window.addEventListener('load', function() {
		setHeight(['.display', '.notification']);
	});
	window.addEventListener('resize', function() {
		setHeight(['.display', '.notification']);
	});

	// Websiteサービス全体を監視
	$scope.Website = Website;

	// resultBox選択処理
	$scope.selectedResultBox = { id: 0 };
	$scope.checkChildRadio = function(index) {
		if ($scope.selectedResultBox.id == index + 1) {
			return $scope.closeResultBox(index);
		} else {
			$scope.selectedResultBox.id = index + 1;
		}
	};
	$scope.checkSelectedResultBox = function(index) {
		return $scope.selectedResultBox.id == index + 1;
	};
	$scope.closeResultBox = function(index) {
		$scope.selectedResultBox.id = 0;
	};
	$scope.summary = function() {
		return $scope.selectedResultBox.id > 0;
	};
}]);
