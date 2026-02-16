<?php

class TelegramService
{
    private $botToken;

    public function __construct($botToken)
    {
        $this->botToken = trim((string) $botToken);
    }

    public function sendDocument($chatId, $filePath, $caption = '')
    {
        if ($this->botToken === '') {
            return [false, 'EMPTY_BOT_TOKEN', null];
        }

        $chatId = trim((string) $chatId);
        if ($chatId === '') {
            return [false, 'EMPTY_CHAT_ID', null];
        }

        if (!is_file($filePath)) {
            return [false, 'FILE_NOT_FOUND', null];
        }

        $url = 'https://api.telegram.org/bot' . $this->botToken . '/sendDocument';

        $post = [
            'chat_id' => $chatId,
            'caption' => (string) $caption,
            'document' => new CURLFile($filePath, 'application/pdf', basename($filePath)),
            'disable_notification' => false,
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

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
}
