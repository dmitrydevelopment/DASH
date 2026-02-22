<?php

class FinanceCalendarService
{
    /**
     * Первый рабочий день месяца.
     * В январе отправка считается от 5 числа, далее сдвиг на ближайший будний.
     */
    public static function getFirstWorkdayOfMonth($month, $year)
    {
        $m = (int) $month;
        $y = (int) $year;

        $day = ($m === 1) ? 5 : 1;

        $dt = new DateTime(sprintf('%04d-%02d-%02d', $y, $m, $day));

        // 6 = суббота, 7 = воскресенье
        while (in_array((int) $dt->format('N'), [6, 7], true)) {
            $dt->modify('+1 day');
        }

        return $dt->format('Y-m-d');
    }

    /**
     * Альтернативная дата конца месяца (как в рабочем WP коде).
     */
    public static function getAlternativeEndOfMonthDate($month, $year)
    {
        $m = (int) $month;
        $y = (int) $year;

        $current = strtotime(sprintf('%04d-%02d-01', $y, $m));
        $lastDay = (int) date('t', $current);

        // 0..6, где 0 = воскресенье
        $lastDayWeek = (int) date('w', strtotime(sprintf('%04d-%02d-%02d', $y, $m, $lastDay)));

        if ($lastDayWeek === 0 || $lastDayWeek === 6) {
            return date('Y-m-d', strtotime("last tuesday of " . date('Y-m', $current)));
        }
        if ($lastDayWeek === 1 || $lastDayWeek === 2) {
            return date('Y-m-d', strtotime("last friday of " . date('Y-m', $current)));
        }
        if ($lastDayWeek === 3) {
            return date('Y-m-d', strtotime("last monday of " . date('Y-m', $current)));
        }
        if ($lastDayWeek === 4) {
            return date('Y-m-d', strtotime("last friday of " . date('Y-m', $current)));
        }
        if ($lastDayWeek === 5) {
            return date('Y-m-d', strtotime("last wednesday of " . date('Y-m', $current)));
        }

        // fallback
        return date('Y-m-d', strtotime("last friday of " . date('Y-m', $current)));
    }
}
