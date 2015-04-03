<?php

/**
 * @param 絶対URL
 * @return アクセス結果（リダイレクトがあればその履歴も）
 */
function getHeaders($url) {
	$headers = @get_headers($url);
	if (!$headers) {
		return $headers;
	}
	$res = [];
	$c = -1;
	foreach ($headers as $h) {
		if (strpos($h, 'HTTP/') === 0) {
			$res[++$c]['status-line'] = $h;
			$res[$c]['status-code'] = (int)strstr($h, ' ');
		} else {
			$sep = strpos($h,': ');
			$res[$c][strtolower(substr($h, 0, $sep))] = substr($h, $sep + 2);
		}
	}
	$res['count'] = $c + 1;
	$res['status'] = $res[$c]['status-code'];
	return $res;
}

try {
	if (!isset($_GET['url']) || !$_GET['url']) {
		throw new Exception('URLがありません');
	}
	if (!$result = getHeaders($_GET['url'])) {
		throw new Exception('アクセスできません');
	}
} catch (Exception $e) {
	$result = [
		'status' => false,
		'message' => $e->getMessage(),
	];
}
echo json_encode($result);
exit;
