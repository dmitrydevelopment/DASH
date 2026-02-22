-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Фев 16 2026 г., 15:52
-- Версия сервера: 5.7.21-20-beget-5.7.21-20-1-log
-- Версия PHP: 5.6.40

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `kostyasw_dash`
--

-- --------------------------------------------------------

--
-- Структура таблицы `clients`
--
-- Создание: Фев 08 2026 г., 14:02
-- Последнее обновление: Фев 09 2026 г., 13:27
--

DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `legal_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inn` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kpp` varchar(9) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_employee_id` int(10) UNSIGNED DEFAULT NULL,
  `tracker_project_id` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `client_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'support',
  `send_invoice_schedule` tinyint(1) NOT NULL DEFAULT '0',
  `invoice_use_end_month_date` tinyint(1) NOT NULL DEFAULT '0',
  `send_invoice_telegram` tinyint(1) NOT NULL DEFAULT '0',
  `send_invoice_diadoc` tinyint(1) NOT NULL DEFAULT '0',
  `send_act_diadoc` tinyint(1) NOT NULL DEFAULT '0',
  `telegram_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chat_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diadoc_box_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diadoc_department_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `clients`
--

INSERT INTO `clients` (`id`, `name`, `legal_name`, `inn`, `kpp`, `contact_person`, `email`, `additional_email`, `phone`, `industry`, `website`, `manager_employee_id`, `tracker_project_id`, `client_type`, `send_invoice_schedule`, `invoice_use_end_month_date`, `send_invoice_telegram`, `send_invoice_diadoc`, `send_act_diadoc`, `telegram_id`, `chat_id`, `diadoc_box_id`, `diadoc_department_id`, `notes`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Костя Суд', '«Bokov Media Studio»', '9690594682', '1234567', 'Костя Суд', 'kostyasud@gmail.com', 'kostyasud2@gmail.com', '+7 (111) 111-11-11', NULL, NULL, NULL, 0, 'support', 0, 0, 0, 0, 0, '1234567', '-4542861910', NULL, NULL, NULL, 0, '2025-12-24 15:04:27', '2025-12-24 15:06:45'),
(2, 'SVOY', 'ООО «КЛУБНЫЙ ДОМ «СВОЙ»', '7707366010', '770701001', 'SVOY', 'marinatrushko@rambler.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(3, 'Happy End', 'ООО «ЭДВИЛ ХОСПИТАЛИТИ»', '7716808722', '770301001', 'Happy End', 'Yg@happyend.msk.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(4, 'Frankie', 'ООО «СНЕГИРИ»', '7703442252', '770301001', 'Frankie', '8002535@mail.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(5, 'ТЦ на Волгоградке', 'ООО «ПИГМАЛИОН»', '7717791493', '772101001', 'ТЦ на Волгоградке', 'Zelenova@gremm.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(6, 'Musson', 'ООО «НОВЫЕ ФОРМЫ»', '7730718647', '770501001', 'Musson', 'director@musson.rest', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(7, '12 Grand Cafe', 'ООО «ГРАНД КАФЕ»', '7727412730', '770401001', '12 Grand Cafe', 'Van.irina.2019@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(8, 'SHIMA Новая Рига', 'ИП Мушин Кирилл Вилленович', '772734960570', NULL, 'SHIMA Новая Рига', 'zhonetta@bk.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(9, 'Пошаблим', 'ООО «ВАУ КАФЕ!»', '9729294080', '772501001', 'Пошаблим', 'Pochablim@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 0, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(10, 'Pepe Nero', 'ООО «ГОСТИНИЦА КАДАШЕВСКАЯ»', '7705845176', '770601001', 'Pepe Nero', 'restaurant@kadashevskaya.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(11, 'Parisiene', 'ООО «АМИ-СТО»', '7714478780', '771401001', 'Parisiene', 'Parisienne@inbox.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(12, 'Центральный рынок на Маросейке', 'ООО «ЭЛЛИОНС»', '7724946275', '770901001', 'Центральный рынок на Маросейке', 'nastua.besedina@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(13, 'Ugolёk', 'ООО «АНИЧА»', '7703427670', '770301001', 'Ugolёk', 'info@k-sud.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 0, 0, 1, 1, 1, '481193309', NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(14, 'Ладент', 'ООО «ЛАДЕНТ-ВИП»', '7734241718', '770701001', 'Ладент', 'ladentbuh@mail.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(15, 'Atlantica Seafood', 'ООО «КУТУЗОВСКИЙ»', '9729083918', '772901001', 'Atlantica Seafood', 'stanova@atlrest.ru', 'sd@atlrest.ru', NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(16, 'Sapiens', 'ООО «ИСТОК»', '9704066029', '770401001', 'Sapiens', 'glavbuh.sapiens@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(17, 'Granat Hall', 'ООО «СИБИРЬ»', '7724410244', '772301001', 'Granat Hall', 'vstoma1974@mail.ru', NULL, NULL, NULL, NULL, NULL, 21, 'support', 1, 0, 1, 1, 1, NULL, '-1002243108745', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(18, 'Брусника', 'ИП Артемьева Юлия Викторовна', '772880790887', NULL, 'Брусника', 'mar6@brusnikacafe.com', NULL, NULL, NULL, NULL, NULL, 51, 'support', 1, 0, 1, 1, 1, NULL, '-1002420316039', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(19, 'Granat Black', 'ООО «ГРАНАТ-С»', '7743335828', '774301001', 'Granat Black', 'info@granatblack.ru', NULL, NULL, NULL, NULL, NULL, 29, 'support', 1, 0, 1, 0, 0, NULL, '-1002490051346', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(20, 'Trolly', 'ООО «СВ-ПРОЕКТ»', '7724387725', '771801001', 'Trolly', 'sv_project_account@mail.ru', NULL, NULL, NULL, NULL, NULL, 8, 'support', 1, 0, 1, 1, 1, NULL, '-1002481456292', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(21, 'Dune', 'ООО «23 ВЕК»', '5031142205', '504101001', 'Dune', 'vi@dune.rest', 'm.goncharova@kultagency.com', NULL, NULL, NULL, NULL, 22, 'support', 1, 0, 1, 1, 1, NULL, '-1002312038491', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(22, 'Pinch', 'ООО «СКАЗКА»', '9703082388', '771001001', 'Pinch', 'nlobachev777@gmail.com', NULL, NULL, NULL, NULL, NULL, 31, 'support', 1, 0, 1, 1, 1, NULL, '-1002369985715', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(23, 'IZUMI', 'ООО «ФУЮСАМЭ»', '7743297890', '774301001', 'IZUMI', 'ffuyusame@mail.ru', NULL, NULL, NULL, NULL, NULL, 38, 'support', 1, 0, 1, 1, 1, NULL, '-4151987682', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(24, 'ROMO', 'ООО «МОРЕЛЛО»', '7716982738', '771601001', 'ROMO', 'anna.s09.90@mail.ru', NULL, NULL, NULL, NULL, NULL, 12, 'support', 1, 0, 1, 1, 1, NULL, '-1002340600339', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(25, 'Shashleek', 'ООО «ШАШЛЫК»', '7708396433', '772601001', 'Shashleek', 'Shashleek@bk.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 0, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(26, 'Райский Сад и Русские Бани', 'ООО «РУССКИЕ БАНИ»', '5001071606', '500101001', 'Райский Сад и Русские Бани', 'natasha.raiskii-sad2012@yandex.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(27, 'Tuna Bar', 'ООО «ТУНА БАР»', '9704239874', '770401001', 'Tuna Bar', 'Tunabar7@yandex.ru', NULL, NULL, NULL, NULL, NULL, 18, 'support', 1, 0, 1, 1, 1, NULL, '-1002377865137', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(28, 'MYM Moscow / Dubai / SEO', 'ООО «МЕД-Ю-МЕД»', '7730315567', '773001001', 'MYM Moscow / Dubai / SEO', 'fin@med-yu-med.ru', NULL, NULL, NULL, NULL, NULL, 42, 'support', 1, 0, 1, 1, 1, NULL, '-1002408784866', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(29, 'Онкологика | Сайт', 'БЛАГОТВОРИТЕЛЬНЫЙ ФОНД «ОНКОЛОГИКА»', '7703477054', '770501001', 'Онкологика | Сайт', 'ekaterina.sochneva@oncologica.ru', NULL, NULL, NULL, NULL, NULL, 16, 'support', 1, 1, 1, 1, 1, NULL, '-1001730955887', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(30, 'Gagawa', 'ООО «ГАГАВА РЕСТОРАНТС»', '9709030682', '770301001', 'Gagawa', 'alina.chekalina@gagawa.ru', 'nikolay.suyva@gagawa.ru', NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(31, 'SQ Clinic', 'ООО «СМНК КЛИНИК»', '9705225909', '770501001', 'SQ Clinic', 'smnqsrg@mail.ru', 'sqclinic@yandex.com', NULL, NULL, NULL, NULL, 44, 'support', 1, 1, 1, 1, 1, NULL, '-1002333009027', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(32, 'Лаки', 'БФ «ЛАКИ (СЧАСТЛИВЫЙ)»', '9703175307', '770301001', 'Лаки', 'K.Goncharova@sdkgarant.ru', NULL, NULL, NULL, NULL, NULL, 47, 'support', 1, 0, 1, 1, 1, NULL, '-1002463775417', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(33, 'НЕТЛЕТ', 'ООО «НЕТЛЕТ»', '5003161171', '500301001', 'НЕТЛЕТ', 'mora28@rambler.ru', NULL, NULL, NULL, NULL, NULL, 45, 'support', 1, 1, 1, 1, 1, '1598338543', '-4169709423', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(34, 'Северяне', 'ООО «ВАСИЛЁК»', '7703787017', '770301001', 'Северяне', NULL, NULL, NULL, NULL, NULL, NULL, 25, 'support', 1, 0, 1, 1, 1, '29467923', '-1002291482748', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(35, 'Cups', 'ООО «ГРЭЙС МИЛ»', '9721235407', '771401001', 'Cups', 'anya.runova@gmail.com', NULL, NULL, NULL, NULL, NULL, 19, 'support', 1, 0, 1, 1, 1, NULL, '-4608735109', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(36, 'Оттепель', 'ООО «ОТТЕПЕЛЬ»', '7727062806', '771701001', 'Оттепель', 'viko@rbp.moscow', NULL, NULL, NULL, NULL, NULL, 26, 'support', 1, 0, 1, 1, 1, NULL, '-4812036828', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(37, 'Ricci', 'АО «РИЧЧИ И КАПРИЧЧИ»', '7743336123', '771701001', 'Ricci', 'viko@rbp.moscow', NULL, NULL, NULL, NULL, NULL, 28, 'support', 1, 0, 1, 1, 1, NULL, '-4971179185', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(38, 'Московское небо', 'ООО «МОСКОВСКОЕ НЕБО»', '7708359858', '771701001', 'Московское небо', 'nebo@rbp.moscow', NULL, NULL, NULL, NULL, NULL, 27, 'support', 1, 0, 1, 1, 1, NULL, '-4859988624', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(39, 'Домком', 'ИП Ильичева Любовь Петровна', '744810452751', NULL, 'Домком', 'uliana.saltan@gmail.com', NULL, NULL, NULL, NULL, NULL, 36, 'support', 0, 0, 1, 0, 0, '180676093', '-4608860764', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(40, 'Марина Рябус', 'ИП Рябус Марина Владимировна', '773304146882', NULL, 'Марина Рябус', 'marina.ryabus@marinaryabus.ru', 'st.admin@marinaryabus.ru', NULL, NULL, NULL, NULL, 50, 'support', 1, 0, 0, 1, 1, NULL, '-4728351316', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(41, 'GSK', 'ООО «АСВ МЕДИА»', '7722392617', '770901001', 'GSK', 'b.alibekova@asv-media.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 1, 0, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(42, 'FERMA', 'ООО «ФЕРМА»', '5043060363', '504301001', 'FERMA', 'fermarestoran@mail.ru', NULL, NULL, NULL, NULL, NULL, 32, 'support', 1, 0, 1, 1, 1, NULL, '-4759446512', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(43, 'Japcake', 'ООО «ДЖЕЙСИ»', '7730316546', '773001001', 'Japcake', 'fedotov@japcake.ru', NULL, NULL, NULL, NULL, NULL, 41, 'support', 1, 1, 1, 1, 1, NULL, '-4667632667', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(44, 'Онкологика | Бот', 'БЛАГОТВОРИТЕЛЬНЫЙ ФОНД «ОНКОЛОГИКА»', '7703477054', '770501001', 'Онкологика | Бот', 'mariya.martynova@oncologica.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 1, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(45, 'Печорин', 'ООО «ПЕЧОРИН ГРУПП»', '9723141137', '772301001', 'Печорин', NULL, NULL, NULL, NULL, NULL, NULL, 48, 'support', 0, 0, 1, 1, 1, '79416129', '-4671243846', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(46, 'Turbo Tattoo', 'ИП Нидеккер Валентин Георгиевич', '500513433500', NULL, 'Turbo Tattoo', 'turbotttshop@gmail.com', NULL, NULL, NULL, NULL, NULL, 37, 'support', 1, 1, 1, 1, 1, NULL, '-4623866349', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(47, 'Lac', 'ООО «РЕСТТРЕСТ»', '9703203226', '770301001', 'Lac', 'Lac.bistrot@yandex.ru', NULL, NULL, NULL, NULL, NULL, 43, 'support', 1, 0, 1, 1, 1, NULL, '-4930973473', NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(48, 'Jumpman', 'ИП Луканюк Анна Михайловна', '502481055085', NULL, 'Jumpman', 'anna-lukanyuk@ya.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(49, 'FULLMOON', 'ООО «МУН»', '9703035532', '770301001', 'FULLMOON', 'mfull1637@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 0, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(50, 'Kult', 'ИП Дмитриенкова Анна Николаевна', '502405847145', NULL, 'Kult', 'buh.cbu@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 0, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(51, 'The Mob', 'ООО «ГРЭЙС МИЛ»', '9721235407', '771401001', 'The Mob', 'anya.runova@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(52, 'La Griglia', 'ИП Морозов Владислав Юрьевич', '503221683523', NULL, 'La Griglia', 'seenet890@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(53, 'Cazaban', 'ООО «НЕЙТРО»', '9710095003', '771001001', 'Cazaban', 'cazabanbistro@yandex.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(54, 'Nagoya', 'ИП Лукьянова Наталия Леонидовна', '774396442312', NULL, 'Nagoya', 'nagoyamoscow@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 0, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(55, 'Meatfix', 'ИП Коршикова Екатерина Валерьевна', '631228339278', NULL, 'Meatfix', 'uliana.saltan@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 1, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(56, 'Рыбалтика', 'ООО «8 МОРЕЙ»', '6316270692', '631601001', 'Рыбалтика', 'uliana.saltan@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 1, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(57, 'Gaia', 'ООО «МАРКО»', '5032390507', '503201001', 'Gaia', 'seenet890@gmail.com', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 0, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(58, 'Global Catering', 'ООО «ГК НОВИКОВ»', '7704544850', '772501001', 'Global Catering', 'e.batina@globalhcs.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(59, 'Культура Встречи', 'ООО «СКЛ»', '9726078959', '772601001', 'Культура Встречи', 'Sklteambuh@yandex.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(60, 'New White Smile', 'ООО «НЬЮ ВАЙТ СМАЙЛ1»', '9715392063', '771501001', 'New White Smile', 'Orangedent@mail.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 1, 1, 1, 1, '1389772413', NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(61, 'Доктор Мезо', 'ООО «ДОКТОР МЕЗО»', '7730699803', '771401001', 'Доктор Мезо', 'info@mesodoctor.ru', NULL, NULL, NULL, NULL, NULL, 0, 'support', 1, 0, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(62, 'Atlantica Bistro', 'ООО «АТЛАНТИКА БИСТРО»', '9729359475', '772901001', 'Atlantica Bistro', 'stanova@atlrest.ru', 'sd@atlrest.ru', NULL, NULL, NULL, NULL, 34, 'support', 1, 0, 1, 0, 0, NULL, '-1002175307178', NULL, NULL, NULL, 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(63, 'Жена', 'Индивидуальный предприниматель Ангер-Суд Александра Алексеевна', '773129580364', NULL, 'Александра', 'aleks_journalist@mail.ru', NULL, '+7 (909) 691-65-85', NULL, NULL, NULL, 0, 'support', 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-09 16:27:25', '2026-02-09 16:27:25');

-- --------------------------------------------------------

--
-- Структура таблицы `client_act_items`
--
-- Создание: Дек 22 2025 г., 15:59
-- Последнее обновление: Фев 08 2026 г., 15:25
--

DROP TABLE IF EXISTS `client_act_items`;
CREATE TABLE `client_act_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `client_act_items`
--

INSERT INTO `client_act_items` (`id`, `client_id`, `service_name`, `service_amount`, `sort_order`, `created_at`, `updated_at`) VALUES
(2, 3, 'Поддержка сайта happyendmsc.ru и чат-бота @happyendmsc_bot', '7000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(3, 4, 'Поддержка сайта frankiepizza.ru', '3400.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(4, 5, 'Поддержка сайта vol177mall.ru', '4500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(5, 6, 'Поддержка сайта mussoncafe.ru', '5900.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(6, 7, 'Поддержка сайта 12grandcafe.ru', '4900.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(7, 10, 'Поддержка сайта pepe-nero.ru', '6000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(8, 11, 'Поддержка сайта parisiene.ru', '6000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(9, 12, 'Поддержка сайта maroseyka4.ru', '7500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(10, 13, 'Поддержка сайта ugolek.moscow', '12000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(11, 14, 'Поддержка сайта ladent.ru', '49000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(12, 16, 'Поддержка сайта sapiens.moscow', '9000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(13, 17, 'Поддержка сайта granathall.moscow', '8000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(14, 18, 'Поддержка сайта brusnikacafe.ru', '42500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(15, 20, 'Поддержка сайтов trollykids.ru и profitrolly.ru', '5000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(16, 21, 'Поддержка сайта dune.rest', '8600.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(17, 22, 'Поддержка сайта pinchmoscow.ru', '12500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(18, 23, 'Разработка и поддержка сайта izumi-moscow.ru', '14500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(19, 24, 'Поддержка сайта romo.moscow', '5500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(20, 25, 'Поддержка сайта shashleek.moscow', '6500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(21, 26, 'Поддержка сайта raiskii-sad.ru', '15000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(22, 27, 'Поддержка сайта tunabar.ru', '7500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(23, 28, 'Поддержка сайтов med-yu-med.ru и shop.med-yu-med.ru', '22500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(24, 29, 'Поддержка сайта oncologica.ru', '12000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(25, 30, 'Работы по договору № SD_GGWA2024', '49500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(26, 31, 'Разработка и поддержка сайта по договору № SDSQ_2024', '18500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(27, 32, 'Поддержка сайта лакифонд.рф', '14500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(28, 33, 'SEO-сопровождение сайта net-let.ru', '32000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(29, 34, 'Поддержка сайта severyane.moscow', '9000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(30, 35, 'Поддержка сайта cups.moscow', '7500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(31, 36, 'Разработка и поддержка сайта', '10000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(32, 37, 'Разработка и поддержка сайта', '10000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(33, 38, 'Разработка и поддержка сайта', '10000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(34, 40, 'Техническое и SEO-сопровождение сайта marinaryabus.ru', '36500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(35, 41, 'Поддержка сайта GSK', '25000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(36, 42, 'Поддержка и разработка сайта по договору № SDFERMA1_2025', '12500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(37, 43, 'Разработка и поддержка сайта japcake.ru', '19500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(38, 44, 'Техническое сопровождение чат-бота', '7000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(39, 45, 'Разработка и поддержка сайта по договору № SD_PCH_2025', '34500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(40, 46, 'Разработка сайта turbotattoo.ru', '14500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(41, 47, 'Разработка и поддержка сайта по договору № SDLAC_2025', '23500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(42, 48, 'Разработка и поддержка сайта по договору №SD_JUMP25', '18500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(43, 49, 'Разработка и поддержка сайта по договору № SDFM_2025', '13000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(44, 50, 'IT-cопровождение по договору № SDKULT_2025', '13000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(45, 51, 'Поддержка сайта the-mob.rest', '6000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(46, 52, 'Разработка и поддержка сайта по договору № SDLG_2025', '38500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(47, 53, 'Разработка и поддержка сайта cazabanbistro.com', '19500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(48, 54, 'Разработка и поддержка сайта по договору № SDNG1_2025', '16500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(49, 55, 'Разработка и поддержка сайта по договору № SDMF_25', '11000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(50, 56, 'Разработка и поддержка сайта по договору № SDRB_25', '11000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(51, 57, 'Разработка и поддержка сайта по договору № SDGA_2025', '28500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(52, 58, 'Разработка и поддержка сайта по договору № SDGC_25', '14500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(53, 59, 'Разработка и поддержка сайта по договору № SDKV_25', '19500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(54, 60, 'Техническое и SEO-сопровождение веб-сайта по договору SD_NWS25', '42000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(55, 61, 'Техническое и SEO-сопровождение веб-сайта по договору SD_DM25', '50000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(57, 1, 'Наименование', '2000.00', 0, '2026-02-08 18:25:01', '2026-02-08 18:25:01');

-- --------------------------------------------------------

--
-- Структура таблицы `client_invoice_items`
--
-- Создание: Дек 22 2025 г., 15:59
-- Последнее обновление: Фев 09 2026 г., 13:27
--

DROP TABLE IF EXISTS `client_invoice_items`;
CREATE TABLE `client_invoice_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `client_invoice_items`
--

INSERT INTO `client_invoice_items` (`id`, `client_id`, `service_name`, `service_price`, `sort_order`, `created_at`, `updated_at`) VALUES
(4, 2, 'Поддержка сайта svoy.moscow', '6000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(5, 3, 'Поддержка сайта happyendmsc.ru и чат-бота @happyendmsc_bot', '8500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(6, 4, 'Поддержка сайта frankiepizza.ru', '4500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(7, 5, 'Поддержка сайта vol177mall.ru', '6000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(8, 6, 'Поддержка сайта mussoncafe.ru', '5900.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(9, 7, 'Поддержка сайта 12grandcafe.ru', '6000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(10, 8, 'Поддержка сайта shima-newriga.ru', '4400.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(11, 9, 'Поддержка сайта po-chablim.ru', '6000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(12, 10, 'Поддержка сайта pepe-nero.ru', '6000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(13, 11, 'Поддержка сайта parisiene.ru', '7500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(14, 12, 'Поддержка сайта maroseyka4.ru', '8500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(15, 13, 'Поддержка сайта ugolek.moscow', '12000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(16, 14, 'Поддержка сайта ladent.ru', '55000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(17, 15, 'Поддержка сайта atlantica.rest', '5800.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(18, 16, 'Поддержка сайта sapiens.moscow', '9000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(19, 17, 'Поддержка сайта granathall.moscow', '8000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(20, 18, 'Поддержка сайта brusnikacafe.ru', '42500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(21, 19, 'Поддержка сайта granatblack.ru', '10000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(22, 20, 'Поддержка сайтов trollykids.ru и profitrolly.ru', '7500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(23, 21, 'Поддержка сайта dune.rest', '8600.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(24, 22, 'Поддержка сайта pinchmoscow.ru', '12500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(25, 23, 'Разработка и поддержка сайта izumi-moscow.ru', '14500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(26, 24, 'Поддержка сайта romo.moscow', '5500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(27, 25, 'Поддержка сайта shashleek.moscow', '6500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(28, 26, 'Поддержка сайта raiskii-sad.ru', '15000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(29, 27, 'Поддержка сайта tunabar.ru', '7500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(30, 28, 'Поддержка сайтов med-yu-med.ru и shop.med-yu-med.ru', '22500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(31, 28, 'Разработка и поддержка сайта по договору №SDMYM_DUB24', '19500.00', 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(32, 28, 'SEO-сопровождение веб-сайта med-yu-med.ae', '24000.00', 2, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(33, 28, 'SEO-сопровождение веб-сайта med-yu-med.ru', '32000.00', 3, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(34, 28, 'Разработка и поддержка сайта по договору №SHOP_MYM_DUB25', '48500.00', 4, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(35, 29, 'Поддержка сайта oncologica.ru', '12000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(36, 29, 'SEO-сопровождение сайта oncologica.ru', '35000.00', 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(37, 30, 'Работы по договору № SD_GGWA2024', '49500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(38, 31, 'Разработка и поддержка сайта по договору № SDSQ_2024', '18500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(39, 31, 'SEO-сопровождение веб-сайта sqclinic.ru', '24000.00', 1, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(40, 32, 'Поддержка сайта лакифонд.рф', '14500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(41, 33, 'SEO-сопровождение сайта net-let.ru', '32000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(42, 34, 'Поддержка сайта severyane.moscow', '10000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(43, 35, 'Поддержка сайта cups.moscow', '7500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(44, 36, 'Разработка и поддержка сайта', '10000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(45, 37, 'Разработка и поддержка сайта', '10000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(46, 38, 'Разработка и поддержка сайта', '10000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(47, 39, 'Разработка и поддержка сайта domcom.moscow', '14500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(48, 40, 'Техническое и SEO-сопровождение сайта marinaryabus.ru', '36500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(49, 41, 'Поддержка сайта GSK', '25000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(50, 42, 'Поддержка и разработка сайта по договору № SDFERMA1_2025', '12500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(51, 43, 'Разработка и поддержка сайта japcake.ru', '19500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(52, 44, 'Техническое сопровождение чат-бота', '7000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(53, 45, 'Разработка и поддержка сайта по договору № SD_PCH_2025', '34500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(54, 46, 'Разработка сайта turbotattoo.ru', '14500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(55, 47, 'Разработка и поддержка сайта по договору № SDLAC_2025', '23500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(56, 48, 'Разработка и поддержка сайта по договору №SD_JUMP25', '18500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(57, 49, 'Разработка и поддержка сайта по договору № SDFM_2025', '13000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(58, 50, 'IT-cопровождение по договору № SDKULT_2025', '13000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(59, 51, 'Поддержка сайта the-mob.rest', '6000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(60, 52, 'Разработка и поддержка сайта по договору № SDLG_2025', '38500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(61, 53, 'Разработка и поддержка сайта cazabanbistro.com', '19500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(62, 54, 'Разработка и поддержка сайта по договору № SDNG1_2025', '16500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(63, 55, 'Разработка и поддержка сайта по договору № SDMF_25', '11000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(64, 56, 'Разработка и поддержка сайта по договору № SDRB_25', '11000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(65, 57, 'Разработка и поддержка сайта по договору № SDGA_2025', '28500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(66, 58, 'Разработка и поддержка сайта по договору № SDGC_25', '14500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(67, 59, 'Разработка и поддержка сайта по договору № SDKV_25', '19500.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(68, 60, 'Техническое и SEO-сопровождение веб-сайта по договору SD_NWS25', '42000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(69, 61, 'Техническое и SEO-сопровождение веб-сайта по договору SD_DM25', '50000.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(70, 62, 'Поддержка сайта atlanticabistro.ru + Smartomato', '13300.00', 0, '2025-12-24 15:04:27', '2025-12-24 15:04:27'),
(74, 1, 'Поддержка сайта.', '15000.00', 0, '2026-02-08 18:25:01', '2026-02-08 18:25:01'),
(75, 1, 'Тест услуга 1', '12000.00', 1, '2026-02-08 18:25:01', '2026-02-08 18:25:01'),
(76, 1, 'Тест услуга 2', '10000.00', 2, '2026-02-08 18:25:01', '2026-02-08 18:25:01'),
(77, 63, 'Поддержка сайта', '10.00', 0, '2026-02-09 16:27:25', '2026-02-09 16:27:25');

-- --------------------------------------------------------

--
-- Структура таблицы `crm_employee_roles`
--
-- Создание: Дек 23 2025 г., 13:27
-- Последнее обновление: Фев 09 2026 г., 11:31
--

DROP TABLE IF EXISTS `crm_employee_roles`;
CREATE TABLE `crm_employee_roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `role_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_tag` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `crm_employee_roles`
--

INSERT INTO `crm_employee_roles` (`id`, `role_name`, `role_tag`, `sort_order`, `created_at`, `updated_at`) VALUES
(63, 'Аккаунт-менеджер', 'account_manager', 0, '2026-02-09 14:31:49', '2026-02-09 14:31:49'),
(64, 'Поддержка', 'support', 1, '2026-02-09 14:31:49', '2026-02-09 14:31:49'),
(65, 'Дизайнер', 'designer', 2, '2026-02-09 14:31:49', '2026-02-09 14:31:49');

-- --------------------------------------------------------

--
-- Структура таблицы `crm_work_categories`
--

DROP TABLE IF EXISTS `crm_work_categories`;
CREATE TABLE `crm_work_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_planned_invoices`
--

DROP TABLE IF EXISTS `finance_planned_invoices`;
CREATE TABLE `finance_planned_invoices` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `period_year` smallint(5) UNSIGNED NOT NULL,
  `period_month` tinyint(3) UNSIGNED NOT NULL,
  `planned_send_date` date DEFAULT NULL,
  `status` enum('planned','sent_waiting_payment','paid','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `work_items_json` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `categories_json` longtext COLLATE utf8mb4_unicode_ci,
  `total_sum` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sent_at` datetime DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `payment_status_cached` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date_cached` datetime DEFAULT NULL,
  `days_overdue_cached` int(11) NOT NULL DEFAULT '0',
  `is_overdue_cached` tinyint(1) NOT NULL DEFAULT '0',
  `linked_document_id` int(10) UNSIGNED DEFAULT NULL,
  `last_reminded_at` datetime DEFAULT NULL,
  `created_by_user_id` int(10) UNSIGNED DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `crm_settings`
--
-- Создание: Фев 08 2026 г., 17:20
-- Последнее обновление: Фев 09 2026 г., 11:31
--

DROP TABLE IF EXISTS `crm_settings`;
CREATE TABLE `crm_settings` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `tinkoff_business_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `dadata_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `scheduler_start_hour` tinyint(3) UNSIGNED NOT NULL DEFAULT '9',
  `crm_public_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_invoice_number_prefix` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INV-',
  `finance_act_number_prefix` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACT-',
  `finance_legal_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_legal_inn` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_legal_kpp` varchar(9) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_legal_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_legal_bank_details` mediumtext COLLATE utf8mb4_unicode_ci,
  `finance_tbank_account_number` varchar(22) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_tbank_invoice_due_days` int(10) UNSIGNED NOT NULL DEFAULT '3',
  `finance_tbank_unit_default` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Шт',
  `finance_tbank_vat_default` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'None',
  `finance_tbank_payment_purpose_template` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_from_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_from_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_subject_invoice` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_subject_act` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_body_invoice_html` mediumtext COLLATE utf8mb4_unicode_ci,
  `finance_email_body_act_html` mediumtext COLLATE utf8mb4_unicode_ci,
  `finance_email_bcc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_telegram_bot_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegram_default_message_invoice` mediumtext COLLATE utf8mb4_unicode_ci,
  `finance_email_body_invoice_reminder_html` mediumtext COLLATE utf8mb4_unicode_ci,
  `telegram_default_message_invoice_reminder` mediumtext COLLATE utf8mb4_unicode_ci,
  `finance_diadoc_api_client_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_diadoc_login` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_diadoc_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_diadoc_from_box_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `crm_settings`
--

INSERT INTO `crm_settings` (`id`, `tinkoff_business_token`, `dadata_token`, `scheduler_start_hour`, `crm_public_url`, `finance_invoice_number_prefix`, `finance_act_number_prefix`, `finance_legal_name`, `finance_legal_inn`, `finance_legal_kpp`, `finance_legal_address`, `finance_legal_bank_details`, `finance_tbank_account_number`, `finance_tbank_invoice_due_days`, `finance_tbank_unit_default`, `finance_tbank_vat_default`, `finance_tbank_payment_purpose_template`, `finance_email_from_email`, `finance_email_from_name`, `finance_email_subject_invoice`, `finance_email_subject_act`, `finance_email_body_invoice_html`, `finance_email_body_act_html`, `finance_email_bcc`, `finance_telegram_bot_token`, `telegram_default_message_invoice`, `finance_diadoc_api_client_id`, `finance_diadoc_login`, `finance_diadoc_password`, `finance_diadoc_from_box_id`, `created_at`, `updated_at`) VALUES
(1, 't.eKEesb29xRU7njlzjQQC_7TY-_IhdopJjp_OIfkIcO2O88A7dQXnAW7_h-0fLmLI2TvK200wNYIwumXMoH0Hdw', 'bda365ae0d4858016cbf5f2c031ef320802930fa', 9, 'https://dash.k-sud.com/', 'INV-', 'ACT-', 'ИП СУД КОНСТАНТИН ИСААКОВИЧ', '772030911520', '', 'РОССИЯ, Г. МОСКВА, УЛ КУБИНКА, Д 15, КОРП 2, КВ 136', '40802810800001095453', '30101810145250000974', 7, 'Шт', 'None', 'Счет на оплату № {INVOICE_NUMBER}, от {PERIOD}', 'admin@k-sud.com', 'Konstantin Sud | Web Agency', 'Счет на оплату', 'Акт выполненных работа', '', '', '', 'bot7878528507:AAFzlbV9RtcOHe1qJxIk9tIuVCQReaGG-iM', 'Счет на оплату за {PERIOD}. {DOWNLOAD_URL}', 'API-75592555-3c0e-4cb2-9474-0c6a21695430', 'kostyasud@gmail.com', 'Zbandut959!', 'dea7b39f0a22476c92eb533a3a938158@diadoc.ru', '2025-12-23 15:24:54', '2026-02-09 14:31:49');

-- --------------------------------------------------------

--
-- Структура таблицы `employees`
--
-- Создание: Дек 20 2025 г., 12:42
--

DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `telegram_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_on_vacation` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `salary_monthly` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `skills_raw` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `employees`
--

INSERT INTO `employees` (`id`, `full_name`, `position`, `email`, `phone`, `employee_type`, `user_id`, `telegram_id`, `avatar_path`, `is_default`, `is_on_vacation`, `is_active`, `salary_monthly`, `start_date`, `skills_raw`, `created_at`, `updated_at`) VALUES
(4, 'Костя Суд', 'Аккаунт-менеджер', 'kostyasud@gmail.com', '123456', 'account_manager', NULL, '138268576', '/uploads/avatars/emp_4_1766486125_13bab762891b.jpg', 0, 0, 1, 0, '2019-06-01', '', '2025-12-20 17:22:00', '2025-12-23 13:38:35'),
(5, 'Елена Воронина', 'Дизайнер', 'lena.voronina.2000@mail.ru', '123456', 'designer', NULL, '431909316', NULL, 0, 0, 1, 57500, '2024-07-09', '', '2025-12-20 17:23:14', '2025-12-23 13:37:55'),
(6, 'Антонина Кузнецова', 'Поддержка', '12kuznetsova03@gmail.com', '1234556', 'support', NULL, '1071369803', NULL, 1, 0, 1, 33000, '2025-06-03', '', '2025-12-20 17:25:07', '2025-12-23 13:38:13'),
(7, 'Елизавета Корнилова', 'Поддержка', 'Lizaszao@yandex.ru', '121212212', 'support', NULL, '725114582', NULL, 0, 0, 1, 21000, '2023-08-16', '', '2025-12-20 17:25:59', '2025-12-23 13:37:00'),
(8, 'Мария Агапова', 'Поддержка', 'Maryinlove15@gmail.com', '123456', 'support', NULL, '217777949', NULL, 0, 0, 0, 10000, '2025-05-13', '', '2025-12-20 17:28:02', '2025-12-22 13:39:53');

-- --------------------------------------------------------

--
-- Структура таблицы `employee_salary_history`
--
-- Создание: Дек 20 2025 г., 13:37
--

DROP TABLE IF EXISTS `employee_salary_history`;
CREATE TABLE `employee_salary_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `amount` int(11) NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `employee_salary_history`
--

INSERT INTO `employee_salary_history` (`id`, `employee_id`, `amount`, `changed_at`) VALUES
(7, 4, 100000, '2025-12-23 13:34:26'),
(8, 4, 200000, '2025-12-23 13:35:47'),
(9, 7, 21000, '2025-12-23 13:37:00'),
(10, 5, 57500, '2025-12-23 13:37:55'),
(11, 6, 33000, '2025-12-23 13:38:13'),
(12, 4, 0, '2025-12-23 13:38:35');

-- --------------------------------------------------------

--
-- Структура таблицы `employee_schedule`
--
-- Создание: Дек 20 2025 г., 11:06
--

DROP TABLE IF EXISTS `employee_schedule`;
CREATE TABLE `employee_schedule` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `weekday` tinyint(3) UNSIGNED NOT NULL COMMENT '1=Пн ... 7=Вс',
  `is_working` tinyint(1) NOT NULL DEFAULT '0',
  `hour_from` tinyint(3) UNSIGNED DEFAULT NULL,
  `hour_to` tinyint(3) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `employee_schedule`
--

INSERT INTO `employee_schedule` (`id`, `employee_id`, `weekday`, `is_working`, `hour_from`, `hour_to`) VALUES
(71, 4, 1, 1, 10, 19),
(72, 4, 2, 1, 10, 19),
(73, 4, 3, 1, 10, 19),
(74, 4, 4, 1, 10, 19),
(75, 4, 5, 1, 10, 19),
(76, 4, 6, 0, NULL, NULL),
(77, 4, 7, 0, NULL, NULL),
(78, 5, 1, 1, 10, 17),
(79, 5, 2, 1, 10, 17),
(80, 5, 3, 1, 10, 17),
(81, 5, 4, 1, 10, 17),
(82, 5, 5, 0, NULL, NULL),
(83, 5, 6, 0, NULL, NULL),
(84, 5, 7, 1, 10, 17),
(92, 7, 1, 1, 10, 18),
(93, 7, 2, 1, 10, 18),
(94, 7, 3, 1, 10, 18),
(95, 7, 4, 0, NULL, NULL),
(96, 7, 5, 1, 10, 18),
(97, 7, 6, 1, 10, 18),
(98, 7, 7, 0, NULL, NULL),
(99, 8, 1, 1, 14, 16),
(100, 8, 2, 1, 14, 16),
(101, 8, 3, 1, 14, 16),
(102, 8, 4, 1, 14, 16),
(103, 8, 5, 1, 14, 16),
(104, 8, 6, 0, NULL, NULL),
(105, 8, 7, 0, NULL, NULL),
(106, 6, 1, 1, 18, 0),
(107, 6, 2, 1, 18, 0),
(108, 6, 3, 1, 18, 0),
(109, 6, 4, 1, 18, 0),
(110, 6, 5, 1, 18, 0),
(111, 6, 6, 0, NULL, NULL),
(112, 6, 7, 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `finance_bank_operations`
--
-- Создание: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_bank_operations`;
CREATE TABLE `finance_bank_operations` (
  `id` int(10) UNSIGNED NOT NULL,
  `operation_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operation_time` datetime DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(22) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `counterparty_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counterparty_inn` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_json` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `matched_document_id` int(10) UNSIGNED DEFAULT NULL,
  `match_method` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `matched_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_documents`
--
-- Создание: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_documents`;
CREATE TABLE `finance_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `doc_type` enum('invoice','act') COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `period_year` smallint(5) UNSIGNED NOT NULL,
  `period_month` tinyint(3) UNSIGNED NOT NULL,
  `doc_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `doc_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_sum` decimal(12,2) NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RUB',
  `file_rel_path` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(10) UNSIGNED DEFAULT NULL,
  `file_sha256` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `download_token` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tbank_invoice_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tbank_pdf_url` text COLLATE utf8mb4_unicode_ci,
  `tbank_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tbank_created_at` datetime DEFAULT NULL,
  `diadoc_message_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diadoc_entity_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  `paid_sum` decimal(12,2) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `last_payment_check_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_download_events`
--
-- Создание: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_download_events`;
CREATE TABLE `finance_download_events` (
  `id` int(10) UNSIGNED NOT NULL,
  `document_id` int(10) UNSIGNED NOT NULL,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_send_events`
--
-- Создание: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_send_events`;
CREATE TABLE `finance_send_events` (
  `id` int(10) UNSIGNED NOT NULL,
  `document_id` int(10) UNSIGNED NOT NULL,
  `channel` enum('email','telegram','diadoc') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `recipient_hash` char(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','success','failed','skipped') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `attempts` tinyint(3) UNSIGNED NOT NULL DEFAULT '0',
  `last_attempt_at` datetime DEFAULT NULL,
  `success_at` datetime DEFAULT NULL,
  `last_error` text COLLATE utf8mb4_unicode_ci,
  `response_json` longtext COLLATE utf8mb4_unicode_ci,
  `open_token` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opened_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_sync_state`
--
-- Создание: Фев 08 2026 г., 14:02
-- Последнее обновление: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_sync_state`;
CREATE TABLE `finance_sync_state` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `tbank_cursor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_from_utc` datetime DEFAULT NULL,
  `last_to_utc` datetime DEFAULT NULL,
  `last_run_at` datetime DEFAULT NULL,
  `last_error` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `finance_sync_state`
--

INSERT INTO `finance_sync_state` (`id`, `tbank_cursor`, `last_from_utc`, `last_to_utc`, `last_run_at`, `last_error`) VALUES
(1, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--
-- Создание: Дек 08 2025 г., 09:34
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `login` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','employee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'employee',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `login`, `password_hash`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2b$10$YhqSAFE.31Z7WU8Z8RP.6OVdV6F4OZHRmj1c4syZhNcwqjtyerioq', 'admin', 1, '2025-12-08 12:37:02', '2025-12-08 12:37:02'),
(2, 'admin2', '$2b$10$wDS8ZpxvlS8KqsgwOo89O.IuMWvwxStQZNkDtI/itWFnAYu8mdVJS', 'admin', 1, '2025-12-08 12:58:03', '2025-12-08 12:58:03');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_clients_is_active` (`is_active`),
  ADD KEY `idx_clients_manager_employee_id` (`manager_employee_id`),
  ADD KEY `idx_clients_tracker_project_id` (`tracker_project_id`),
  ADD KEY `idx_clients_inn` (`inn`),
  ADD KEY `idx_clients_kpp` (`kpp`),
  ADD KEY `idx_clients_client_type` (`client_type`),
  ADD KEY `idx_clients_send_invoice_schedule` (`send_invoice_schedule`),
  ADD KEY `idx_clients_send_invoice_diadoc` (`send_invoice_diadoc`),
  ADD KEY `idx_clients_send_act_diadoc` (`send_act_diadoc`);

--
-- Индексы таблицы `client_act_items`
--
ALTER TABLE `client_act_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cai_client_id` (`client_id`);

--
-- Индексы таблицы `client_invoice_items`
--
ALTER TABLE `client_invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cii_client_id` (`client_id`);

--
-- Индексы таблицы `crm_employee_roles`
--
ALTER TABLE `crm_employee_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_role_tag` (`role_tag`),
  ADD KEY `idx_sort` (`sort_order`);

--
-- Индексы таблицы `crm_settings`
--
ALTER TABLE `crm_work_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_work_category_tag` (`tag`),
  ADD KEY `idx_work_category_sort` (`sort_order`),
  ADD KEY `idx_work_category_active` (`is_active`);

--
-- Индексы таблицы `finance_planned_invoices`
--
ALTER TABLE `finance_planned_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_fpi_client_period` (`client_id`,`period_year`,`period_month`),
  ADD KEY `idx_fpi_client_period` (`client_id`,`period_year`,`period_month`),
  ADD KEY `idx_fpi_status` (`status`),
  ADD KEY `idx_fpi_planned_send_date` (`planned_send_date`),
  ADD KEY `idx_fpi_linked_document` (`linked_document_id`);

--
-- Индексы таблицы `crm_settings`
--
ALTER TABLE `crm_settings`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employees_user_id` (`user_id`);

--
-- Индексы таблицы `employee_salary_history`
--
ALTER TABLE `employee_salary_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_changed` (`employee_id`,`changed_at`);

--
-- Индексы таблицы `employee_schedule`
--
ALTER TABLE `employee_schedule`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_employee_weekday` (`employee_id`,`weekday`);

--
-- Индексы таблицы `finance_bank_operations`
--
ALTER TABLE `finance_bank_operations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_operation_id` (`operation_id`),
  ADD KEY `idx_time` (`operation_time`),
  ADD KEY `idx_matched` (`matched_document_id`,`matched_at`);

--
-- Индексы таблицы `finance_documents`
--
ALTER TABLE `finance_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_doc_period` (`doc_type`,`client_id`,`period_year`,`period_month`),
  ADD UNIQUE KEY `uniq_download_token` (`download_token`),
  ADD KEY `idx_client_period` (`client_id`,`period_year`,`period_month`),
  ADD KEY `idx_doc_number` (`doc_number`),
  ADD KEY `idx_paid` (`is_paid`,`paid_at`);

--
-- Индексы таблицы `finance_download_events`
--
ALTER TABLE `finance_download_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_doc_time` (`document_id`,`requested_at`);

--
-- Индексы таблицы `finance_send_events`
--
ALTER TABLE `finance_send_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_doc_channel_recipient` (`document_id`,`channel`,`recipient_hash`),
  ADD UNIQUE KEY `uniq_open_token` (`open_token`),
  ADD KEY `idx_status_attempts` (`status`,`attempts`),
  ADD KEY `idx_doc` (`document_id`);

--
-- Индексы таблицы `finance_sync_state`
--
ALTER TABLE `finance_sync_state`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_users_login` (`login`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT для таблицы `client_act_items`
--
ALTER TABLE `client_act_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT для таблицы `client_invoice_items`
--
ALTER TABLE `client_invoice_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT для таблицы `crm_employee_roles`
--
ALTER TABLE `crm_employee_roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT для таблицы `crm_work_categories`
--
ALTER TABLE `crm_work_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `employee_salary_history`
--
ALTER TABLE `employee_salary_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT для таблицы `employee_schedule`
--
ALTER TABLE `employee_schedule`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT для таблицы `finance_bank_operations`
--
ALTER TABLE `finance_planned_invoices`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `finance_bank_operations`
--
ALTER TABLE `finance_bank_operations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `finance_documents`
--
ALTER TABLE `finance_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `finance_download_events`
--
ALTER TABLE `finance_download_events`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `finance_send_events`
--
ALTER TABLE `finance_send_events`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `client_act_items`
--
ALTER TABLE `client_act_items`
  ADD CONSTRAINT `fk_cai_client_id` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `client_invoice_items`
--
ALTER TABLE `client_invoice_items`
  ADD CONSTRAINT `fk_cii_client_id` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `employee_salary_history`
--
ALTER TABLE `employee_salary_history`
  ADD CONSTRAINT `fk_salary_hist_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `employee_schedule`
--
ALTER TABLE `employee_schedule`
  ADD CONSTRAINT `fk_employee_schedule_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ограничения внешнего ключа таблицы `finance_planned_invoices`
--
ALTER TABLE `finance_planned_invoices`
  ADD CONSTRAINT `fk_fpi_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_fpi_document` FOREIGN KEY (`linked_document_id`) REFERENCES `finance_documents` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
