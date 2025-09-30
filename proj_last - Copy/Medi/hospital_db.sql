-- phpMyAdmin SQL Dump
-- version 4.5.1
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Apr 09, 2025 at 08:36 AM
-- Server version: 10.1.16-MariaDB
-- PHP Version: 7.0.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hospital_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointment`
--

CREATE TABLE `appointment` (
  `appointment_id` int(11) NOT NULL,
  `consulting_id` varchar(20) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `appointment_time` datetime NOT NULL,
  `document_path` varchar(255) DEFAULT NULL,
  `action` varchar(255) DEFAULT 'approve/reject',
  `status` varchar(20) NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `appointment`
--

INSERT INTO `appointment` (`appointment_id`, `consulting_id`, `patient_id`, `doctor_id`, `appointment_time`, `document_path`, `action`, `status`) VALUES
(1, '106bd55e', 1, 4, '2025-02-21 12:24:00', 'uploads/bg.png', 'Rejected', 'Rejected'),
(2, 'ae03f7a5', 1, 4, '2025-10-03 13:00:00', 'uploads/project.pdf', 'Approved', 'Rejected'),
(3, 'f965f784', 1, 4, '2222-02-01 12:22:00', 'uploads/6th_results.pdf', 'Approved', 'Pending'),
(4, '2d2813d7', 1, 4, '1999-11-01 12:45:00', 'uploads/car.jpeg', 'Approved', 'Pending'),
(5, '1c9f6d97', 1, 6, '1999-11-01 12:12:00', 'uploads/6th_results.pdf', 'Approved', 'Pending');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_documents`
--

CREATE TABLE `appointment_documents` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `document_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `doctor`
--

CREATE TABLE `doctor` (
  `doctor_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `availability_status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `doctor`
--

INSERT INTO `doctor` (`doctor_id`, `name`, `specialization`, `email`, `password`, `contact_number`, `availability_status`) VALUES
(4, 'jobin', 'DERMO', 'jj1@gmail.com', 'scrypt:32768:8:1$qO7uTlsNsp0wQVwn$d5a0bdb2122d08300e70d8b01a338aa66565f20a7019b22c294ff459b254812264396e97f2e00b8b0f2ac95c713beb65ebdab97f23ae48408a742f368208714e', '09740319908', 'sunday'),
(5, 'jasmine', 'skin', 'jas@gmail.com', 'scrypt:32768:8:1$rARGgHOYVq2rpCyC$75ab7bbb8df9328bfc135b19adddb381b12c66978ce76836aaa4125e13689d66a61e59ff575a867165d7546cc58a93b800f8f7cf9770e79668d1f87672a0455d', '09740319908', 'available'),
(6, 'joseph', 'Physician', 'jo@gmail.com', 'scrypt:32768:8:1$XvZzRHZ6WLyGVQV5$b91078acb42ef1c6192b6fc9e96cf4ed5b7f242c3cfe3311ce1592f2962db82f430f7cc763b94408297b1f2af3a5793529a041470e28f9f8c8fabacff3a415be', '9877665544', 'Available');

-- --------------------------------------------------------

--
-- Table structure for table `patient`
--

CREATE TABLE `patient` (
  `patient_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `dob` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `patient`
--

INSERT INTO `patient` (`patient_id`, `name`, `email`, `password`, `contact_number`, `address`, `gender`, `dob`) VALUES
(1, 'Jobin jacob', 'jobin@gmail.com', 'scrypt:32768:8:1$9xNjtxMGmRINPMDG$ad5de5575b85ced4b457242c36ad3e63aa3197494b9af33eec50e5e61d410f1f0d76165f07ee7eae83aa5665d4d9b0863c162e802c13beb5f056a7101d22ae02', '09740319908', 'Mangalore', 'male', '1999-11-01'),
(2, 'jobin jacob', 'j@gmail.com', 'scrypt:32768:8:1$8DeeQJkUAORjnUBX$113e1cee16d5f9295325dac572a82cbb3f08232282cde6d9baec100568c30df17fd19954e2f04b59a1784cdb645dddf6677bf6af3b4a6b501b8c88d6b6fc6866', '9988556677', 'mangalore', 'male', '1188-11-01'),
(3, 'joseph', 'jo@gmail.com', 'scrypt:32768:8:1$ltGxJqIybxWhrK0H$5e23e35119c7e1881ba1c4488bb3e65177f291bf3de09de934c6fbd5f3bceb88fb811412fc052d1e2b50044f75649f557a50e410c10ad49c160cd79d00b3a02e', '9740319908', 'Mangalore', 'Male', '1888-11-01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointment`
--
ALTER TABLE `appointment`
  ADD PRIMARY KEY (`appointment_id`),
  ADD UNIQUE KEY `consulting_id` (`consulting_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `appointment_documents`
--
ALTER TABLE `appointment_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `doctor`
--
ALTER TABLE `doctor`
  ADD PRIMARY KEY (`doctor_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `patient`
--
ALTER TABLE `patient`
  ADD PRIMARY KEY (`patient_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointment`
--
ALTER TABLE `appointment`
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
--
-- AUTO_INCREMENT for table `appointment_documents`
--
ALTER TABLE `appointment_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `doctor`
--
ALTER TABLE `doctor`
  MODIFY `doctor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `patient`
--
ALTER TABLE `patient`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointment`
--
ALTER TABLE `appointment`
  ADD CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointment_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE CASCADE;

--
-- Constraints for table `appointment_documents`
--
ALTER TABLE `appointment_documents`
  ADD CONSTRAINT `appointment_documents_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
