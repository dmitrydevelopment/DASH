<?php

class FinanceFileStorage
{
    public static function ensureDir($absDir)
    {
        if (!is_dir($absDir)) {
            mkdir($absDir, 0775, true);
        }
    }

    /**
     * @return array{rel_path:string, abs_path:string, file_name:string, size:int, sha256:string}
     */
    public static function savePdfBytes($docType, $year, $month, $fileName, $bytes)
    {
        $docType = preg_replace('/[^a-z0-9_]/i', '', (string) $docType);
        $year = (int) $year;
        $month = (int) $month;

        $safeName = self::sanitizeFileName($fileName);
        if ($safeName === '') {
            $safeName = $docType . '.pdf';
        }

        $relDir = sprintf('storage/finance/%s/%04d/%02d', $docType, $year, $month);
        $absDir = rtrim(APP_BASE_PATH, '/') . '/' . $relDir;
        self::ensureDir($absDir);

        $absPath = $absDir . '/' . $safeName;
        file_put_contents($absPath, $bytes);

        $size = (int) filesize($absPath);
        $sha = hash_file('sha256', $absPath);

        return [
            'rel_path' => $relDir . '/' . $safeName,
            'abs_path' => $absPath,
            'file_name' => $safeName,
            'size' => $size,
            'sha256' => $sha,
        ];
    }

    public static function savePdfFile($docType, $year, $month, $fileName, $sourceAbsPath)
    {
        $bytes = file_get_contents($sourceAbsPath);
        if ($bytes === false) {
            throw new RuntimeException("Не удалось прочитать файл: " . $sourceAbsPath);
        }
        return self::savePdfBytes($docType, $year, $month, $fileName, $bytes);
    }

    public static function sanitizeFileName($name)
    {
        $name = trim((string) $name);
        $name = preg_replace('/\\s+/', '_', $name);
        $name = preg_replace('/[^a-zA-Z0-9а-яА-Я_.()-]/u', '_', $name);
        $name = substr($name, 0, 180);
        return $name;
    }
}
