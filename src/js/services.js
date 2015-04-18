(function() {
	'use strict';

	app.factory('Website', ['$q', '$http', function($q, $http) {

		// 任意のウェブページのURLとhref属性の値から絶対URLを返す
		var getAbsoluteUrl;
		window.addEventListener('load', function() {
			getAbsoluteUrl = (function() {
				// 事前にiframeを追加しとく
				var work = document.createElement('iframe');
				work.style.display = 'none';
				document.body.appendChild(work);
				// 実際の関数部分
				return function(path, base) {
					var wdoc = work.contentWindow.document;
					var url = path;
					wdoc.open();
					wdoc.write('<head><base href="' + base + '"><\/head><body><a href="' + path + '"><\/a><\/body>');
					wdoc.close();
					url = wdoc.getElementsByTagName('a')[0].href;
					return url;
				};
			})();
		});

		// あるURLのアクセス可否を調べる関数
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
			complete: false,
			// Viewから呼ばれる関数
			check: function(url) {
				var self = this;
				var set = function(url) {
					// ユーザーの入力URLを保存
					self.top = url;
					// 入力URLをpagesに追加
					var newPage = {
						url: url,
						title: '',
						enabled: null,
						inner: [],
						count: {
							success: 0,
							warning: 0,
							error: 0
						}
					};
					self.pages.push(newPage);
				};
				// サイト内をクロールする関数（未チェックのURLがなくなるまで再帰的に呼ばれる）
				var crawl = function() {
					// 1ページ内をスクレイピングしてURLを取得する関数
					var search = function(url) {
						var d = $q.defer();
						var api = 'api/scraping.php';
						var query = {
							params: {
								url: url
							}
						};
						var callback = function(response) {
							var data = response.data;
							if (data.status) {
								// 取得したタイトルを格納
								self.pages[self.current].title = data.title;
								// 取得したa要素をループ
								angular.forEach(data.a, function(html, href) {
									var a = {
										url: href,
										absoluteUrl: getAbsoluteUrl(href, data.url),
										text: html,
										enabled: null,
										status: null
									};
									var _checkCache = function(url) {
										var cached = false;
										angular.forEach(self.cache, function(cache) {
											if (cache.url === url) {
												cached = cache;
											}
										});
										return cached;
									};
									var checkCache = function() {
										// キャッシュに追加済みかどうかのチェック
										var cached = _checkCache(a.absoluteUrl);
										var index = self.current;
										var innerIndex = self.pages[self.current].inner.length - 1;
										if (cached) {
											// cache に追加済みの場合はページ内URLの enabled を更新
											a.enabled = cached.enabled;
											a.status = cached.status;
											self.pages[index].count[cached.enabled]++;
										} else {
											var pushToCache = function(enabled, result) {
												// cache に追加
												var newUrl = {
													url: a.absoluteUrl,
													enabled: enabled,
													status: result
												};
												self.cache.push(newUrl);
											};
											var success = function(result) {
												a.enabled = 'success';
												a.status = result;
												self.pages[index].count.success++;
												if (!_checkCache(a.absoluteUrl)) {
													self.result.success.push({
														url: a.absoluteUrl,
														status: result
													});
													pushToCache('success', result);
												}
											};
											var failed = function(result) {
												a.enabled = 'error';
												a.status = result;
												self.pages[index].count.error++;
												if (!_checkCache(a.absoluteUrl)) {
													self.result.error.push({
														url: a.absoluteUrl,
														status: result
													});
													pushToCache('error', result);
												}
											};
											var notify = function(result) {
												a.enabled = 'warning';
												a.status = result;
												self.pages[index].count.warning++;
												if (!_checkCache(a.absoluteUrl)) {
													self.result.warning.push({
														url: a.absoluteUrl,
														status: result
													});
													pushToCache('warning', result);
												}
											};
											// cache に未追加の場合はアクセス可否をチェック
											isAccessible(a.absoluteUrl).then(success, failed, notify);
										}
									};
									var addPage = function() {
										// pages に追加済みかチェック
										var isAdded = false;
										angular.forEach(self.pages, function(item) {
											if (item.url === a.absoluteUrl) {
												isAdded = true;
											}
										});
										// サイト内のURLかどうかチェック
										var isInnerSite = a.absoluteUrl.indexOf(self.top) === 0;
										// 画像ファイルかどうかチェック
										var isImageFile = a.absoluteUrl.search(/(.jpg|.gif|.png)$/i) !== -1;
										// クエリ付きかどうかチェック
										var hasQuery = a.absoluteUrl.search(/\?/) !== -1;
										// ハッシュ付きかどうかチェック
										var hasHash = a.absoluteUrl.search(/#/) !== -1;
										// 条件に合致すれば pages に追加
										if (!isAdded && isInnerSite && !isImageFile && !hasQuery && !hasHash) {
											var newPage = {
												url: a.absoluteUrl,
												title: '',
												enabled: null,
												inner: [],
												count: {
													success: 0,
													warning: 0,
													error: 0
												}
											};
											self.pages.push(newPage);
										}
									};
									checkCache();
									// ページ内URLに追加
									self.pages[self.current].inner.push(a);
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
					self.message = self.pages[self.current].url;
					search(self.pages[self.current].url).then(success, failed);
				};
				set(url);
				crawl();
			}
		};
	}]);
})();
