<?php

class TBankService
{
    private $token;
    private $baseUrl;

    public function __construct($token, $baseUrl = 'https://business.tbank.ru/openapi/api/v1')
    {
        $this->token = trim((string) $token);
        $this->baseUrl = rtrim((string) $baseUrl, '/');
    }

    public function createInvoice(array $payload)
    {
        if ($this->token === '') {
            return [false, 'EMPTY_TOKEN', null];
        }

        $url = $this->baseUrl . '/invoice/send';

        return $this->requestJson('POST', $url, $payload);
    }

    public function getInvoiceInfo($invoiceId)
    {
        if ($this->token === '') {
            return [false, 'EMPTY_TOKEN', null];
        }

        $invoiceId = urlencode((string) $invoiceId);
        $url = $this->baseUrl . '/invoice/' . $invoiceId . '/info';

        return $this->requestJson('GET', $url, null);
    }

    public function getStatement($accountNumber, $fromDate, $toDate, $cursor = null)
    {
        if ($this->token === '') {
            return [false, 'EMPTY_TOKEN', null];
        }

        $qs = [
            'accountNumber' => (string) $accountNumber,
            'from' => (string) $fromDate,
            'to' => (string) $toDate,
        ];
        if ($cursor !== null && $cursor !== '') {
            $qs['cursor'] = (string) $cursor;
        }

        $url = $this->baseUrl . '/statement?' . http_build_query($qs);

        return $this->requestJson('GET', $url, null);
    }

    private function requestJson($method, $url, $json)
    {
        $headers = [
            'Authorization: Bearer ' . $this->token,
            'Accept: application/json',
        ];

        $body = null;
        if ($json !== null) {
            $headers[] = 'Content-Type: application/json; charset=utf-8';
            $body = json_encode($json, JSON_UNESCAPED_UNICODE);
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        if (strtoupper($method) === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        } else {
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        }

        $resp = curl_exec($ch);
        $err = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($resp === false) {
            return [false, 'CURL_ERROR: ' . $err, null];
        }

        if ($code < 200 || $code >= 300) {
            return [false, 'HTTP_' . $code, $resp];
        }

        $decoded = json_decode($resp, true);
        if (!is_array($decoded)) {
            return [false, 'BAD_JSON', $resp];
        }

        return [true, '', $decoded];
    }
}
