<?php

require_once('Analyzer.php');

function d($val) {
	echo '<pre>';
	var_dump($val);
	echo '</pre>';
}

try {
	if (!isset($_GET['url']) || !$_GET['url']) {
		throw new Exception('URLがありません');
	}

	$analyzer = new Analyzer($_GET['url']);

	$result = [
		'status' => true,
		'hrefs' => $analyzer->getHrefs(),
	];
	echo json_encode($result);

} catch (Exception $e) {

	$result = [
		'status' => false,
		'message' => $e->getMessage(),
	];
	echo json_encode($result);
}
