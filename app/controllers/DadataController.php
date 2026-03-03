<?php

require_once APP_BASE_PATH . '/app/auth/Auth.php';
require_once APP_BASE_PATH . '/app/models/SettingsModel.php';

class DadataController
{
    /**
     * @var SettingsModel
     */
    private $settings;

    public function __construct(mysqli $db)
    {
        $this->settings = new SettingsModel($db);
    }

    public function partySuggest()
    {
        Auth::requireAuth();

        $token = trim((string) (($this->settings->get()['dadata_token'] ?? '')));
        if ($token === '') {
            sendError('DADATA_TOKEN_NOT_SET', 'Не задан токен DaData в настройках', 500);
        }

        $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
        if ($q === '' || mb_strlen($q) < 2) {
            sendJson(['success' => true, 'data' => ['items' => []]]);
        }

        $url = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party';

        $payload = json_encode([
            'query' => $q,
            'count' => 10
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
            'Authorization: Token ' . $token
        ]);

        $raw = curl_exec($ch);
        $errno = curl_errno($ch);
        $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno !== 0 || $http < 200 || $http >= 300 || !$raw) {
            sendError('DADATA_ERROR', 'Ошибка запроса к DaData', 502);
        }

        $decoded = json_decode($raw, true);
        $suggestions = (is_array($decoded) && isset($decoded['suggestions']) && is_array($decoded['suggestions']))
            ? $decoded['suggestions']
            : [];

        $items = [];
        foreach ($suggestions as $s) {
            $value = isset($s['value']) ? (string)$s['value'] : '';
            $data  = isset($s['data']) && is_array($s['data']) ? $s['data'] : [];

            $nameFull = '';
            if (isset($data['name']) && is_array($data['name']) && !empty($data['name']['full_with_opf'])) {
                $nameFull = (string)$data['name']['full_with_opf'];
            }

            $items[] = [
                'value' => $value,
                'name'  => $nameFull !== '' ? $nameFull : $value,
                'inn'   => isset($data['inn']) ? (string)$data['inn'] : '',
                'kpp'   => isset($data['kpp']) ? (string)$data['kpp'] : '',
                'legal_address' => isset($data['address']) && is_array($data['address'])
                    ? (string) (($data['address']['unrestricted_value'] ?? $data['address']['value'] ?? ''))
                    : '',
            ];
        }

        sendJson([
            'success' => true,
            'data' => [
                'items' => $items
            ]
        ]);
    }
}
