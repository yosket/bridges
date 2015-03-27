<?php

require_once('../../Vendor/autoload.php');

class Analyzer {
	private $_url;
	private $_originals = [];
	private $_hrefs = [];

	private function _check($url) {
		// 正常なURLでない場合エラーが出るため@をつける
		$header = @get_headers($url);
		return $header !== false && !preg_match('#^HTTP/.*\s+[404]+\s#i', $header[0]) ? true : false;
	}

	// ベースURL と 相対パス情報から、絶対パス(http(s)://～～)を返す
	private function _absUrl($baseURL, $relativePath) {
		if ($relativePath == '') {
			// 相対パスが空の場合は、baseURLをそのまま返す
			return $baseURL;
		}
		if (preg_match('@^https?://@iD', $relativePath)) {
			// 相対パスが http(s):// から始まる場合は、そのまま返す
			return $relativePath;
		}
		// baseURL の分解
		if (!preg_match('@^(https?://[^/]+)/?(.*)$@iD',
			$baseURL, $tmpMatches)) {
			// http(s)://～～から始まらない場合
			if ($baseURL[0] != '/') {
				return false;
			}
			$tmpMatches = array(
				$baseURL,
				'',
				substr($baseURL, 1)
			);
		}
		$base = $tmpMatches[1];     // e.g. http://www.example.com
		$tmpPath = $tmpMatches[2];  // e.g. hoge/fuga/index.php
		$path = array();
		if (preg_match('@^/@iD', $relativePath)) {
			// 相対パスが/から始まる場合
			return $base . $relativePath;
		}
		// baseURLパス情報にディレクトリが含まれていれば
		// baseURLのパス情報をディレクトリ情報のみに
		if (strlen($tmpPath) > 0 && strpos($tmpPath, '/') !== false) {
			if ($tmpPath[strlen($tmpPath) - 1] == '/') {
				// 最後が / なら/を削除
				$tmpPath = substr($tmpPath, 0, -1);
			} else {
				// 最後が / ではない(ファイル名)の場合、/ までを削除
				$tmpPath = substr($tmpPath, 0, strrpos($tmpPath, '/'));
			}
			// ディレクトリ名毎に配列にする
			$path = explode('/', $tmpPath);
		}
		// 相対パス情報をディレクトリ毎に配列にする
		$relativePath = explode('/', $relativePath);
		// 相対パスディレクトリ毎に
		foreach($relativePath as $dir) {
			if ($dir == '.') {
				// /./ は処理をスキップ
				continue;
			}
			if (preg_match('@^\.+$@iD', $dir)) {
				// /../ /.../ などなら、ディレクトリを上にたどる
				for ($i=1; $i < strlen($dir); $i++) {
					array_pop($path);
				}
				continue;
			}
			// .以外のディレクトリ名の場合は、そのまま追加
			$path[] = $dir;
		}
		// パスを/で結合
		$path = implode('/', $path);
		return $base . '/' . $path;
	}

	public function __construct($url) {
		if (!$this->_check($url)) {
			throw new Exception('不正なURLです');
		}
		$this->_url = $url;
	}

	// URL内の要素を検索
	public function search() {
		$html = phpQuery::newDocumentFile($this->_url);
		phpQuery::newDocument($html);

		// a要素を検索してhref属性を返す
		foreach (pq('a') as $a) {
			$original = pq($a)->attr('href');
			if (!in_array($original, $this->_originals)) {
				$this->_originals[] = $original;
			}
			$url = $this->_absUrl($this->_url, $original);
			if (!in_array($url, $this->_hrefs)) {
				$this->_hrefs[] = $url;
			}
		}
	}

	public function getOriginals() {
		return $this->_originals;
	}

	public function getHrefs() {
		return $this->_hrefs;
	}
}
