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
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
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

    public function sendUpdPdf($counteragentInn, $fileName, $fileAbsPath, $documentDateYmd, $totalSumInt, $documentNumber)
    {
        if (!is_file($fileAbsPath)) {
            return [false, 'FILE_NOT_FOUND', null];
        }
        $xml = (string) file_get_contents($fileAbsPath);
        return $this->sendUpdXml(
            (string) $counteragentInn,
            [
                'document_date' => (string) $documentDateYmd,
                'document_number' => (string) $documentNumber,
                'total_sum' => (int) $totalSumInt,
                'document_name' => 'Универсальный передаточный документ',
                'document_creator' => 'DASH CRM',
                'item_name' => 'Услуги',
                'item_subtotal' => (float) $totalSumInt,
                'xml_override' => $xml,
            ]
        );
    }

    public function sendUpdXml($counteragentInn, array $updData)
    {
        $auth = $this->ensureAuth();
        if (!$auth[0]) {
            return $auth;
        }

        if ($this->fromBoxIdEmail === '') {
            return [false, 'EMPTY_FROM_BOX_ID', null];
        }

        $fromGuid = $this->boxIdToGuid($this->fromBoxIdEmail);
        if ($fromGuid === null) {
            return [false, 'BAD_FROM_BOX_ID', null];
        }

        $toBoxId = $this->findCounteragentBoxIdByInn($fromGuid, (string)$counteragentInn);
        if (!$toBoxId) {
            return [false, 'COUNTERAGENT_NOT_FOUND', null];
        }

        $function = isset($updData['document_function']) ? trim((string)$updData['document_function']) : 'СЧФДОП';
        $version = isset($updData['document_version']) ? trim((string)$updData['document_version']) : 'utd970_05_03_01';
        $docDate = isset($updData['document_date']) ? trim((string)$updData['document_date']) : date('Y-m-d');
        $docNumber = isset($updData['document_number']) ? trim((string)$updData['document_number']) : '';

        if ($docNumber === '') {
            return [false, 'EMPTY_DOCUMENT_NUMBER', null];
        }

        $xml = isset($updData['xml_override']) ? trim((string)$updData['xml_override']) : '';
        if ($xml === '') {
            $userDataXml = $this->buildUpdUserDataXml($this->fromBoxIdEmail, $toBoxId, $function, $docDate, $docNumber, $updData);
            $gen = $this->generateTitleXml(
                $this->fromBoxIdEmail,
                'UniversalTransferDocument',
                $function,
                $version,
                0,
                $userDataXml
            );
            if (!$gen[0]) {
                return $gen;
            }
            $xml = (string)$gen[2];
        }

        $payload = [
            'FromBoxId' => $this->fromBoxIdEmail,
            'ToBoxId' => $toBoxId,
            'DelaySend' => true,
            'DocumentAttachments' => [
                [
                    'TypeNamedId' => 'UniversalTransferDocument',
                    'Function' => $function,
                    'Version' => $version,
                    'NeedRecipientSignature' => true,
                    'SignedContent' => [
                        'Content' => base64_encode($xml),
                        // Для прод-подписания используем сертификат ящика в Диадок.
                        'SignWithTestSignature' => false,
                    ],
                    'Metadata' => [
                        ['Key' => 'FileName', 'Value' => (string)($updData['file_name'] ?? ('UPD_' . $docNumber . '.xml'))],
                        ['Key' => 'DocumentDate', 'Value' => $docDate],
                        ['Key' => 'DocumentNumber', 'Value' => $docNumber],
                        ['Key' => 'TotalSum', 'Value' => (int)($updData['total_sum'] ?? 0)],
                    ],
                ],
            ],
        ];

        return $this->postMessage($payload);
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

        return $this->postMessage($message);
    }

    private function postMessage(array $message)
    {
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
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
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

    private function generateTitleXml($boxId, $documentTypeNamedId, $documentFunction, $documentVersion, $titleIndex, $userDataXml)
    {
        $header = 'DiadocAuth ddauth_api_client_id=' . $this->apiClientId . ',ddauth_token=' . $this->authToken;
        $query = http_build_query([
            'boxId' => (string)$boxId,
            'documentTypeNamedId' => (string)$documentTypeNamedId,
            'documentFunction' => (string)$documentFunction,
            'documentVersion' => (string)$documentVersion,
            'titleIndex' => (int)$titleIndex,
            'disableValidation' => 'true',
        ], '', '&', PHP_QUERY_RFC3986);
        $url = $this->baseUrl . '/GenerateTitleXml?' . $query;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: ' . $header,
            'Content-Type: application/xml; charset=utf-8',
            'Accept: application/xml',
        ]);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, (string)$userDataXml);

        $resp = curl_exec($ch);
        $err = curl_error($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($resp === false) {
            return [false, 'GEN_XML_CURL_ERROR: ' . $err, null];
        }
        if ($code < 200 || $code >= 300) {
            return [false, 'GEN_XML_HTTP_' . $code, $resp];
        }

        return [true, '', (string)$resp];
    }

    private function buildUpdUserDataXml($fromBoxId, $toBoxId, $function, $docDateYmd, $docNumber, array $data)
    {
        $docDate = $this->formatDateForDiadoc($docDateYmd);
        $docName = htmlspecialchars((string)($data['document_name'] ?? 'Документ о передаче товаров (работ, услуг, имущественных прав)'), ENT_QUOTES, 'UTF-8');
        $docCreator = htmlspecialchars((string)($data['document_creator'] ?? 'DASH CRM'), ENT_QUOTES, 'UTF-8');
        $itemName = htmlspecialchars((string)($data['item_name'] ?? 'Услуги'), ENT_QUOTES, 'UTF-8');
        $subtotal = number_format((float)($data['item_subtotal'] ?? $data['total_sum'] ?? 0), 2, '.', '');
        $total = number_format((float)($data['total_sum'] ?? 0), 2, '.', '');
        $func = htmlspecialchars((string)$function, ENT_QUOTES, 'UTF-8');
        $num = htmlspecialchars((string)$docNumber, ENT_QUOTES, 'UTF-8');
        $from = htmlspecialchars((string)$fromBoxId, ENT_QUOTES, 'UTF-8');
        $to = htmlspecialchars((string)$toBoxId, ENT_QUOTES, 'UTF-8');

        return "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
            . "<UniversalTransferDocument Function=\"{$func}\" DocumentDate=\"{$docDate}\" DocumentNumber=\"{$num}\" Currency=\"643\" DocumentName=\"{$docName}\" DocumentCreator=\"{$docCreator}\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\">"
            . "<Seller><OrganizationReference OrgType=\"1\" BoxId=\"{$from}\"/></Seller>"
            . "<Buyer><OrganizationReference OrgType=\"1\" BoxId=\"{$to}\"/></Buyer>"
            . "<Shipper SameAsSeller=\"true\"/>"
            . "<Consignee><OrganizationReference OrgType=\"1\" BoxId=\"{$to}\"/></Consignee>"
            . "<Table TotalWithVatExcluded=\"{$total}\" Vat=\"0.00\" Total=\"{$total}\" TotalNet=\"{$total}\">"
            . "<Item Product=\"{$itemName}\" TaxRate=\"без НДС\" Subtotal=\"{$subtotal}\"/>"
            . "</Table>"
            . "<TransferInfo OperationInfo=\"Передача товаров (работ, услуг)\"/>"
            . "</UniversalTransferDocument>";
    }

    private function formatDateForDiadoc($dateYmd)
    {
        $s = trim((string)$dateYmd);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)) {
            $ts = strtotime($s);
            if ($ts !== false) {
                return date('d.m.Y', $ts);
            }
        }
        if (preg_match('/^\d{2}\.\d{2}\.\d{4}$/', $s)) {
            return $s;
        }
        return date('d.m.Y');
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
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
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
