<?php

class EmailService
{
    private $fromEmail;
    private $fromName;
    private $bccList;

    public function __construct($fromEmail, $fromName = '', $bccList = '')
    {
        $this->fromEmail = trim((string) $fromEmail);
        $this->fromName = trim((string) $fromName);
        $this->bccList = trim((string) $bccList);
    }

    /**
     * @param array $attachments array of ['path' => '/abs/file.pdf', 'name' => 'file.pdf', 'type' => 'application/pdf']
     */
    public function send($to, $subject, $htmlBody, array $attachments = [])
    {
        $to = trim((string) $to);
        if ($to === '') {
            return [false, 'EMPTY_TO'];
        }

        $subject = (string) $subject;

        $from = $this->fromEmail !== '' ? $this->fromEmail : 'no-reply@' . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost');
        $fromName = $this->fromName !== '' ? $this->fromName : $from;

        $headers = [];
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'From: ' . $this->encodeHeader($fromName) . ' <' . $from . '>';

        if ($this->bccList !== '') {
            $headers[] = 'Bcc: ' . $this->bccList;
        }

        $boundary = 'b1_' . bin2hex(random_bytes(12));

        if ($attachments) {
            $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';

            $body = '';
            $body .= '--' . $boundary . "\r\n";
            $body .= "Content-Type: text/html; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $body .= (string) $htmlBody . "\r\n";

            foreach ($attachments as $att) {
                $path = isset($att['path']) ? (string) $att['path'] : '';
                if ($path === '' || !is_file($path)) {
                    continue;
                }

                $name = isset($att['name']) ? (string) $att['name'] : basename($path);
                $type = isset($att['type']) ? (string) $att['type'] : 'application/octet-stream';

                $fileData = file_get_contents($path);
                if ($fileData === false) {
                    continue;
                }

                $body .= '--' . $boundary . "\r\n";
                $body .= 'Content-Type: ' . $type . '; name="' . $this->encodeHeader($name) . "\"\r\n";
                $body .= "Content-Transfer-Encoding: base64\r\n";
                $body .= 'Content-Disposition: attachment; filename="' . $this->encodeHeader($name) . "\"\r\n\r\n";
                $body .= chunk_split(base64_encode($fileData)) . "\r\n";
            }

            $body .= '--' . $boundary . "--\r\n";
        } else {
            $headers[] = 'Content-Type: text/html; charset=UTF-8';
            $body = (string) $htmlBody;
        }

        $ok = mail($to, $this->encodeHeader($subject), $body, implode("\r\n", $headers));

        return [$ok, $ok ? '' : 'MAIL_FAILED'];
    }

    private function encodeHeader($text)
    {
        $text = (string) $text;
        if ($text === '') return '';
        return '=?UTF-8?B?' . base64_encode($text) . '?=';
    }
}
