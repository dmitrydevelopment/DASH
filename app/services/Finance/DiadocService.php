<?php

class DiadocService
{
    private $apiClientId;
    private $login;
    private $password;
    private $fromBoxIdEmail;
    private $baseUrl;

    private $authToken = null;

    public function __construct($apiClientId, $login, $password, $fromBoxIdEmail, $baseUrl = 'https://diadoc-api.kontur.ru')
    {
        $this->apiClientId = trim((string) $apiClientId);
        $this->login = trim((string) $login);
        $this->password = (string) $password;
        $this->fromBoxIdEmail = trim((string) $fromBoxIdEmail);
        $this->baseUrl = rtrim((string) $baseUrl, '/');
    }

    public function ensureAuth()
    {
        if ($this->authToken) {
            return [true, '', $this->authToken];
        }

        if ($this->apiClientId === '' || $this->login === '' || $this->password === '') {
            return [false, 'EMPTY_DIADOC_CREDENTIALS', null];
        }

        $url = $this->baseUrl . '/v3/Authenticate?type=password';

        $header = 'DiadocAuth ddauth_api_client_id=' . $this->apiClientId;

        $headers = [
            'Authorization: ' . $header,
            'Content-Type: application/json; charset=utf-8',
            'Accept: application/json',
        ];

        $data = json_encode(['login' => $this->login, 'password' => $this->password], JSON_UNESCAPED_UNICODE);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);

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

        $token = trim((string) $resp);
        if ($token === '') {
            return [false, 'EMPTY_AUTH_TOKEN', $resp];
        }

        $this->authToken = $token;
        return [true, '', $token];
    }

    public function sendInvoicePdf($counteragentInn, $fileName, $fileAbsPath, $documentDateYmd, $totalSumInt, $documentNumber)
    {
        return $this->sendPdfByTypeNamedId(
            'ProformaInvoice',
            (string) $counteragentInn,
            (string) $fileName,
            (string) $fileAbsPath,
            (string) $documentDateYmd,
            (int) $totalSumInt,
            (string) $documentNumber
        );
    }

    public function sendActPdf($counteragentInn, $fileName, $fileAbsPath, $documentDateYmd, $totalSumInt, $documentNumber)
    {
        return $this->sendPdfByTypeNamedId(
            'AcceptanceCertificate',
            (string) $counteragentInn,
            (string) $fileName,
            (string) $fileAbsPath,
            (string) $documentDateYmd,
            (int) $totalSumInt,
            (string) $documentNumber
        );
    }

    private function sendPdfByTypeNamedId($typeNamedId, $counteragentInn, $fileName, $fileAbsPath, $documentDateYmd, $totalSumInt, $documentNumber)
    {
        $auth = $this->ensureAuth();
        if (!$auth[0]) {
            return $auth;
        }

        if ($this->fromBoxIdEmail === '') {
            return [false, 'EMPTY_FROM_BOX_ID', null];
        }

        if (!is_file($fileAbsPath)) {
            return [false, 'FILE_NOT_FOUND', null];
        }

        $fromGuid = $this->boxIdToGuid($this->fromBoxIdEmail);
        if ($fromGuid === null) {
            return [false, 'BAD_FROM_BOX_ID', null];
        }

        $clientBoxId = $this->findCounteragentBoxIdByInn($fromGuid, $counteragentInn);
        if (!$clientBoxId) {
            return [false, 'COUNTERAGENT_NOT_FOUND', null];
        }

        $content = base64_encode(file_get_contents($fileAbsPath));

        $message = [
            'FromBoxId' => $this->fromBoxIdEmail,
            'ToBoxId' => $clientBoxId,
            'DelaySend' => true,
            'DocumentAttachments' => [
                [
                    'TypeNamedId' => (string) $typeNamedId,
                    'NeedRecipientSignature' => true,
                    'SignedContent' => [
                        'Content' => $content,
                        'SignWithTestSignature' => false,
                    ],
                    'Metadata' => [
                        ['Key' => 'FileName', 'Value' => (string) $fileName],
                        ['Key' => 'DocumentDate', 'Value' => (string) $documentDateYmd],
                        ['Key' => 'TotalSum', 'Value' => (int) $totalSumInt],
                        ['Key' => 'DocumentNumber', 'Value' => (string) $documentNumber],
                    ],
                ],
            ],
        ];

        $sendData = json_encode($message, JSON_UNESCAPED_UNICODE);

        $header = 'DiadocAuth ddauth_api_client_id=' . $this->apiClientId . ',ddauth_token=' . $this->authToken;

        $headers = [
            'Authorization: ' . $header,
            'Content-Type: application/json; charset=utf-8',
            'Accept: application/json',
        ];

        $url = $this->baseUrl . '/V3/PostMessage';

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 200);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $sendData);

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

        return [true, '', $resp];
    }

    private function findCounteragentBoxIdByInn($myBoxGuid, $inn)
    {
        $header = 'DiadocAuth ddauth_api_client_id=' . $this->apiClientId . ',ddauth_token=' . $this->authToken;

        $headers = [
            'Authorization: ' . $header,
            'Accept: application/json',
        ];

        $url = $this->baseUrl . '/V3/GetCounteragents?myBoxId=' . urlencode($myBoxGuid) . '&counteragentStatus=IsMyCounteragent&query=' . urlencode((string) $inn);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_HTTPGET, 1);

        $resp = curl_exec($ch);
        $err = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($resp === false) {
            return null;
        }
        if ($code < 200 || $code >= 300) {
            return null;
        }

        $decoded = json_decode($resp, true);
        if (!is_array($decoded) || empty($decoded['TotalCount']) || empty($decoded['Counteragents'][0]['Organization']['Boxes'][0]['BoxId'])) {
            return null;
        }

        return (string) $decoded['Counteragents'][0]['Organization']['Boxes'][0]['BoxId'];
    }

    /**
     * Преобразует boxId вида xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@diadoc.ru в GUID вида xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     */
    private function boxIdToGuid($boxIdEmail)
    {
        $s = (string) $boxIdEmail;
        $s = explode('@', $s)[0];
        $s = preg_replace('/[^a-f0-9]/i', '', $s);
        if (strlen($s) !== 32) {
            return null;
        }
        $s = strtolower($s);
        return substr($s, 0, 8) . '-' . substr($s, 8, 4) . '-' . substr($s, 12, 4) . '-' . substr($s, 16, 4) . '-' . substr($s, 20, 12);
    }
}
