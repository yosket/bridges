(function() {
	'use strict';

	var app = angular.module('app', ['ngAnimate']);

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
			count: {
				success: 0,
				warning: 0,
				error: 0
			},
			complete: false,
			// Viewから呼ばれる関数
			check: function(url) {
				var self = this;
				var set = function(url) {
					self.top = url;
					var newPage = {
						url: url,
						enabled: null,
						inner: []
					};
					self.pages.push(newPage);
				};
				var crawl = function() {
					var search = function(url) {
						var d = $q.defer();
						var isDuplicated = function(str, array) {
							var duplicated = false;
							angular.forEach(array, function(value) {
								if (value === str) {
									duplicated = true;
								}
							});
							return duplicated;
						};
						var isAccessible = function(url) {
							var d = $q.defer();
							var api = 'api/headers.php';
							var query = {
								params: {
									url: url
								}
							};
							var callback = function(response) {
								switch (response.data.status) {
									case 200:
										d.resolve(response.data.status);
										break;
									case 404:
										d.reject(response.data.status);
										break;
									default:
										d.notify(response.data.status);
										break;
								}
							};
							$http.get(api, query).then(callback);
							return d.promise;
						};
						var api = 'api/scraping.php';
						var query = {
							params: {
								url: url
							}
						};
						var callback = function(response) {
							var data = response.data;
							if (data.status) {
								angular.forEach(data.hrefs, function(href) {
									var addInnerPage = function() {
										// 現在のページにまだ存在しないURLなら
										if (!isDuplicated(href, self.pages[self.current].inner)) {
											// ページ内URLに追加
											var newUrl = {
												url: href,
												enabled: null
											};
											self.pages[self.current].inner.push(newUrl);
										}
									};
									var addCache = function() {
										// cache に追加済みかチェック
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
											// cache に追加済みの場合はページ内URLの enabled を更新
											self.pages[index].inner[innerIndex].enabled = cached.enabled;
										} else {
											var success = function(result) {
												self.pages[index].inner[innerIndex].enabled = result;
												self.count.success++;
												// cache に追加
												var newUrl = {
													url: href,
													enabled: result
												};
												self.cache.push(newUrl);
											};
											var failed = function(result) {
												self.pages[index].inner[innerIndex].enabled = result;
												self.count.error++;
											};
											var notify = function(result) {
												self.pages[index].inner[innerIndex].enabled = result;
												self.count.warning++;
											};
											// cache に未追加の場合はアクセス可否をチェック
											isAccessible(href).then(success, failed, notify);
										}
									};
									var addPage = function() {
										// pages に追加済みかチェック
										var dFlg = false;
										angular.forEach(self.pages, function(item) {
											if (item.url === href) {
												dFlg = true;
											}
										});
										// サイト内のURLかどうかチェック
										var isInnerSite = href.indexOf(self.top) === 0;
										// 画像ファイルかどうかチェック
										var isImageFile = href.search(/(.jpg|.gif|.png)$/i) !== -1;
										// 条件に合致すれば pages に追加
										if (isInnerSite && !dFlg && !isImageFile) {
											var newPage = {
												url: href,
												enabled: null,
												inner: []
											};
											self.pages.push(newPage);
											setResultHeight();
										}
									};
									addInnerPage();
									addCache();
									addPage();
								});
								d.resolve();
							} else {
								d.reject();
							}
						};
						$http.get(api, query).then(callback);
						return d.promise;
					};
					var success = function() {
						self.pages[self.current].enabled = true;
						hasNextPage();
					};
					var failed = function() {
						self.pages[self.current].enabled = false;
						hasNextPage();
					};
					var hasNextPage = function() {
						self.current++;
						if (typeof self.pages[self.current] !== 'undefined') {
							crawl();
						} else {
							self.message = '';
							self.complete = true;
						}
					};
					self.message = 'Analyzing: ' + self.pages[self.current].url;
					search(self.pages[self.current].url).then(success, failed);
				};
				set(url);
				crawl();
			}
		};
	});

	app.controller('AppController', ['$scope', 'Website', function AppController($scope, Website) {
		$scope.Website = Website;
		$scope.reload = function() {
			location.reload();
		};
		setResultHeight();
	}]);

	app.filter('deleteDomain', function(Website) {
		return function(input) {
			var result = input.replace(Website.top, '');
			return result ? result : Website.top;
		};
	});

	var setResultHeight = function() {
		var winHeight = document.documentElement.clientHeight;
		var resultHeight = winHeight - 53 - 47;
		angular.element(document.querySelectorAll('.result')).css('height', resultHeight + 'px');
		angular.element(document.querySelectorAll('.result-box')).css('height', resultHeight + 'px');
	};

	var getAbsoluteUrl = (function() {
		var wimg = new Image();
		var work = document.createElement('iframe');
		work.style.display = 'none';
		document.body.appendChild(work);
		var wdoc = work.contentWindow.document;
		return function(path, base) {
			var url = path;
			if (!base) {
				wimg.src = path;
				url = wimg.src;
			} else {
				wdoc.open();
				wdoc.write('<head><base href="' + base + '" \/><\/head><body><a href="' + path + '"><\/a><\/body>');
				wdoc.close();
				url = wdoc.getElementsByTagName('a')[0].href;
			}
			return url;
		};
	})();
})();
