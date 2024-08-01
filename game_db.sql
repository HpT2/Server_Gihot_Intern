-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 30, 2024 at 11:39 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `game_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `characterinfo`
--

CREATE TABLE `characterinfo` (
  `keyID` int(10) NOT NULL,
  `id` varchar(100) NOT NULL,
  `name` varchar(30) NOT NULL,
  `coin` int(4) NOT NULL,
  `health` int(4) NOT NULL,
  `critrate` int(4) NOT NULL,
  `damage` int(4) NOT NULL,
  `critdmg` int(4) NOT NULL,
  `firerate` int(4) NOT NULL,
  `lifesteal` int(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `characterinfo`
--

INSERT INTO `characterinfo` (`keyID`, `id`, `name`, `coin`, `health`, `critrate`, `damage`, `critdmg`, `firerate`, `lifesteal`) VALUES
(38, 'eff371d0-eaf3-4e5e-bf72-2d30703174b6', 'slhkbf', 4, 0, 0, 0, 0, 0, 0),
(39, '2fc99679-5d4b-4a13-9958-3103787acfb6', '345789', 4, 0, 0, 0, 0, 0, 0),
(40, '8cd56d9a-751c-4db8-92bb-bc89bf6240e5', 'io', 40, 0, 0, 0, 0, 0, 0),
(41, '8a026c2e-53df-4b3a-b70b-8f751f8a689a', 'Mai', 18, 0, 0, 0, 0, 0, 0),
(42, '3477cf42-5cf1-4a61-9ed8-103f0a7cce4f', 'eeee', 15, 0, 0, 0, 0, 0, 0),
(43, 'aaede447-08be-476e-8c00-ea65081c2bd4', 'Noob', 77, 0, 0, 0, 2, 0, 0),
(44, 'becc9bc9-d7a6-4338-9802-4d3915be3fb6', 'Quoc', 63, 1, 0, 0, 1, 0, 0),
(45, 'ed0d73c4-0c7c-4e2f-ac40-38a5e88c8d0a', 'EmsITpH', 115, 2, 0, 0, 0, 0, 0),
(46, 'eb740adc-10ea-44e6-827a-e7b9db63bd1d', '', 0, 0, 0, 0, 0, 0, 0),
(47, '8e32a15b-4e1c-4723-85f0-1ca524b2f1a8', 'NewQuoc', 141, 1, 0, 0, 0, 0, 0),
(48, '625c5e54-a4e2-454d-8b8e-522208472f7d', 'xcxc', 13, 0, 0, 0, 0, 0, 0),
(49, '1c7ab8ce-b4c3-479c-a2a2-c58ba98f36c3', 'jk', 5, 0, 0, 0, 0, 0, 0),
(50, '0b39b831-5845-40dd-82f3-7f9f1ed95e73', '123', 7, 0, 0, 0, 0, 0, 0),
(51, '961a6de9-cbc2-45a5-8fb6-affb4a272918', '234', 11, 0, 0, 0, 0, 0, 0),
(52, 'eff4de17-0802-4fbe-a31b-fb4aa73cc1cd', 'zxc', 36, 0, 0, 0, 0, 0, 0),
(53, 'a5ee3fd7-c721-47c7-900b-b1b829253131', 'aaaa', 27, 0, 0, 0, 0, 0, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `characterinfo`
--
ALTER TABLE `characterinfo`
  ADD PRIMARY KEY (`keyID`),
  ADD UNIQUE KEY `id` (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `characterinfo`
--
ALTER TABLE `characterinfo`
  MODIFY `keyID` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
