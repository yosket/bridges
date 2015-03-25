<?php

require_once('Analyzer.php');

try {
	if (!isset($_GET['url']) || !$_GET['url']) {
		throw new Exception('URLがありません');
	}
	if (!isset($_GET['type']) || !$_GET['type']) {
		throw new Exception('タイプが指定されていません');
	}
	$analyzer = new Analyzer($_GET['url']);
	if (isset($_GET['type'])) {
		switch ($_GET['type']) {
			case 'check':
				$result = [
					'status' => ture,
				];
				break;
			case 'search':
				$analyzer->search();
				$result = [
					'status' => true,
					'hrefs' => $analyzer->getHrefs(),
				];
				break;
			default:
				throw new Exception('タイプが不正です');
				break;
		}
		echo json_encode($result);
	}
} catch (Exception $e) {
	$result = [
		'status' => false,
		'message' => $e->getMessage(),
	];
	echo json_encode($result);
}
