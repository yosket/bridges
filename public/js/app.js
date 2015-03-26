(function() {
	'use strict';

	var app = angular.module('app', []);

	app.factory('Website', function($q, $http) {
		return {

			// 入力されたURLを格納
			top: '',

			// チェックしたページとそのページ内のリンクを格納
			pages: [],

			// URLベースでアクセス可否を格納
			cache: [],

			// どのURLをチェック中か等
			message: '',

			// pagesをループさせる際のインデックス
			current: 0,

			// Viewから呼ばれる関数
			check: function(url) {
				this.set(url);
				this.crawl();
			},

			// 入力されたURLを格納する関数
			set: function(url) {
				this.top = url;
				this.pages.push({
					url: url,
					enabled: null,
					inner: []
				});
				this.message = url + ' の調査を開始';
			},

			// pagesをループさせる関数
			crawl: function() {
				var self = this;
				self.message = self.pages[self.current].url + ' を調査中 ...';
				self.search(self.pages[self.current].url).then(function() {
					self.pages[self.current].enabled = true;
					hasNextPage();
				}, function() {
					self.pages[self.current].enabled = false;
					hasNextPage();
				});
				var hasNextPage = function() {
					self.current++;
					if (typeof self.pages[self.current] !== 'undefined') {
						self.crawl();
					} else {
						self.message = '';
					}
				};
			},

			// サーバーへアクセスして結果をpagesとcacheに入れていく関数
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
						d.resolve();
					} else {
						d.reject();
					}
				});
				return d.promise;
			},

			// 一つのURLのアクセス可否を調べる関数
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

	// 配列内の重複した値の有無をチェックする関数
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
