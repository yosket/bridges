<?php

require_once('../../Vendor/autoload.php');

class Analyzer {
	private $_url;
	private $_originals = [];

	private function _check($url) {
		// 正常なURLでない場合エラーが出るため@をつける
		$header = @get_headers($url);
		return $header !== false && !preg_match('#^HTTP/.*\s+[404]+\s#i', $header[0]) ? true : false;
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
		}
	}

	public function getUrl() {
		return $this->_url;
	}

	public function getOriginals() {
		return $this->_originals;
	}
}

try {
	if (!isset($_GET['url']) || !$_GET['url']) {
		throw new Exception('URLがありません');
	}
	$analyzer = new Analyzer($_GET['url']);
	$analyzer->search();
	$result = [
		'status' => true,
		'url' => $analyzer->getUrl(),
		'originals' => $analyzer->getOriginals(),
	];
} catch (Exception $e) {
	$result = [
		'status' => false,
		'url' => $analyzer->getUrl(),
		'message' => $e->getMessage(),
	];
}
echo json_encode($result);
