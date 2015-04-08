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
			result: {
				success: [],
				warning: [],
				error: []
			},
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
										// status が false なら
										if (!response.data.status) {
											// エラーにする処理
										}
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
								angular.forEach(data.originals, function(href) {
									var absoluteUrl = getAbsoluteUrl(href, self.top);
									var addInnerPage = function() {
										// 現在のページにまだ存在しないURLなら
										if (!isDuplicated(href, self.pages[self.current].inner)) {
											// ページ内URLに追加
											var newUrl = {
												url: href,
												absoluteUrl: absoluteUrl,
												enabled: null,
												status: null
											};
											self.pages[self.current].inner.push(newUrl);
										}
									};
									var checkCache = function() {
										// cache に追加済みかチェック
										var cached = false;
										angular.forEach(self.cache, function(cache) {
											if (cache.url === absoluteUrl) {
												cached = cache;
												return;
											}
										});
										var index = self.current;
										var innerIndex = self.pages[self.current].inner.length - 1;
										if (cached) {
											// cache に追加済みの場合はページ内URLの enabled を更新
											self.pages[index].inner[innerIndex].enabled = cached.enabled;
											self.pages[index].inner[innerIndex].status = cached.status;
										} else {
											var pushToCache = function(enabled, result) {
												// cache に追加
												var newUrl = {
													url: absoluteUrl,
													enabled: enabled,
													status: result
												};
												self.cache.push(newUrl);
											};
											var success = function(result) {
												self.pages[index].inner[innerIndex].enabled = 'success';
												self.pages[index].inner[innerIndex].status = result;
												self.count.success++;
												self.result.success.push({
													url: self.pages[index].inner[innerIndex].absoluteUrl,
													status: result
												});
												pushToCache('success', result);
											};
											var failed = function(result) {
												self.pages[index].inner[innerIndex].enabled = 'error';
												self.pages[index].inner[innerIndex].status = result;
												self.count.error++;
												self.result.error.push({
													url: self.pages[index].inner[innerIndex].absoluteUrl,
													status: result
												});
												pushToCache('error', result);
											};
											var notify = function(result) {
												self.pages[index].inner[innerIndex].enabled = 'warning';
												self.pages[index].inner[innerIndex].status = result;
												self.count.warning++;
												self.result.warning.push({
													url: self.pages[index].inner[innerIndex].absoluteUrl,
													status: result
												});
												pushToCache('warning', result);
											};
											// cache に未追加の場合はアクセス可否をチェック
											isAccessible(absoluteUrl).then(success, failed, notify);
										}
									};
									var addPage = function() {
										// pages に追加済みかチェック
										var dFlg = false;
										angular.forEach(self.pages, function(item) {
											if (item.url === absoluteUrl) {
												dFlg = true;
											}
										});
										// サイト内のURLかどうかチェック
										var isInnerSite = absoluteUrl.indexOf(self.top) === 0;
										// 画像ファイルかどうかチェック
										var isImageFile = absoluteUrl.search(/(.jpg|.gif|.png)$/i) !== -1;
										// 条件に合致すれば pages に追加
										if (isInnerSite && !dFlg && !isImageFile) {
											var newPage = {
												url: absoluteUrl,
												enabled: null,
												inner: []
											};
											self.pages.push(newPage);
										}
									};
									addInnerPage();
									checkCache();
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
							console.log(self.result);
						}
					};
					self.message = self.pages[self.current].url;
					search(self.pages[self.current].url).then(success, failed);
				};
				set(url);
				crawl();
			}
		};
	});

	app.controller('AppController', ['$scope', 'Website', function AppController($scope, Website) {
		$scope.Website = Website;
		$scope.mouse = {
			on: function(index) {
				setHeight(['.result-box']);
				$scope.summery = true;
				return $scope.activePage = index;
			},
			off: function(index) {
				$scope.summery = false;
				return $scope.activePage = null;
			}
		};
		$scope.isActive = function(index) {
			return $scope.activePage == index;
		};
		setHeight(['.summery', '.result']);
		window.addEventListener('resize', function() {
			setHeight(['.summery', '.result', '.result-box']);
		});
	}]);

	app.filter('deleteDomain', function(Website) {
		return function(input) {
			var result = input.replace(Website.top, '');
			return result ? result : Website.top;
		};
	});

	var setHeight = function(selectors) {
		var winHeight = document.documentElement.clientHeight;
		var resultHeight = winHeight - 53 - 47;
		angular.forEach(selectors, function(selector) {
			angular.element(document.querySelectorAll(selector)).css('height', resultHeight + 'px');
		});
	};

	var getAbsoluteUrl;
	window.onload = function() {
		getAbsoluteUrl = (function() {
			var wimg = new Image();
			var work = document.createElement('iframe');
			work.style.display = 'none';
			document.body.appendChild(work);
			return function(path, base) {
				var wdoc = work.contentWindow.document;
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
	};
})();
