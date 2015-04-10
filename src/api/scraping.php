<?php

require_once('../../Vendor/autoload.php');

// URL内の要素を検索
function search($url) {
	phpQuery::newDocumentFile($url);
	// phpQuery::newDocument($html);
	$data = [];

	// title要素を取得
	foreach (pq('title') as $title) {
		$data['title'] = $title->textContent;
	}

	// a要素を検索してhref属性を取得
	$data['hrefs'] = [];
	foreach (pq('a') as $a) {
		$href = pq($a)->attr('href');
		if (!in_array($href, $data['hrefs'])) {
			array_push($data['hrefs'], $href);
		}
	}

	return $data;
}

try {
	if (!isset($_GET['url']) || !$_GET['url']) {
		throw new Exception('URLがありません');
	}
	$result = [
		'status' => true,
		'url' => $_GET['url'],
	];
	$result = array_merge($result, search($_GET['url']));
} catch (Exception $e) {
	$result = [
		'status' => false,
		'url' => $_GET['url'],
		'message' => $e->getMessage(),
	];
}
echo json_encode($result);
