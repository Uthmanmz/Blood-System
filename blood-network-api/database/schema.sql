
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appointments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` int(10) unsigned NOT NULL,
  `donor_id` int(10) unsigned NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `note` text DEFAULT NULL,
  `delivery_channel` enum('SMS','Email','Both') NOT NULL DEFAULT 'Both',
  `status` enum('Scheduled','Completed','Cancelled') NOT NULL DEFAULT 'Scheduled',
  `cancelled_by` int(10) unsigned DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_appointment_hospital` (`hospital_id`),
  KEY `idx_appointment_donor` (`donor_id`),
  KEY `idx_appointment_date` (`appointment_date`),
  KEY `idx_appointment_status` (`status`),
  KEY `fk_appointment_cancelled_by` (`cancelled_by`),
  CONSTRAINT `fk_appointment_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_donor` FOREIGN KEY (`donor_id`) REFERENCES `donor_profiles` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `blood_request_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blood_request_units` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `blood_request_id` int(10) unsigned NOT NULL,
  `blood_unit_id` int(10) unsigned NOT NULL,
  `allocated_by` int(10) unsigned DEFAULT NULL,
  `allocated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `released_at` datetime DEFAULT NULL,
  `issued_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_request_unit` (`blood_request_id`,`blood_unit_id`),
  KEY `idx_request_unit_request` (`blood_request_id`),
  KEY `idx_request_unit_unit` (`blood_unit_id`),
  KEY `fk_request_unit_allocated_by` (`allocated_by`),
  CONSTRAINT `fk_request_unit_allocated_by` FOREIGN KEY (`allocated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_request_unit_blood_unit` FOREIGN KEY (`blood_unit_id`) REFERENCES `blood_units` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_request_unit_request` FOREIGN KEY (`blood_request_id`) REFERENCES `blood_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `blood_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blood_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tracking_number` varchar(50) NOT NULL,
  `seeker_id` int(10) unsigned NOT NULL,
  `hospital_id` int(10) unsigned NOT NULL,
  `patient_name` varchar(150) NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `urgency` enum('Routine','Urgent') NOT NULL DEFAULT 'Routine',
  `additional_information` text DEFAULT NULL,
  `delivery_channel` enum('SMS','Email','Both') NOT NULL DEFAULT 'Both',
  `status` enum('Submitted','Under Review','Approved','Ready for Collection','Completed','Rejected','Cancelled') NOT NULL DEFAULT 'Submitted',
  `processed_by` int(10) unsigned DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `ready_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tracking_number` (`tracking_number`),
  KEY `idx_request_seeker` (`seeker_id`),
  KEY `idx_request_hospital` (`hospital_id`),
  KEY `idx_request_blood_group` (`blood_group`),
  KEY `idx_request_status` (`status`),
  KEY `idx_request_urgency` (`urgency`),
  KEY `fk_request_processed_by` (`processed_by`),
  CONSTRAINT `fk_request_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_request_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_request_seeker` FOREIGN KEY (`seeker_id`) REFERENCES `seeker_profiles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `blood_unit_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blood_unit_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `blood_unit_id` int(10) unsigned NOT NULL,
  `old_status` enum('Awaiting Screening','Available','Reserved','Issued','Expired','Discarded') DEFAULT NULL,
  `new_status` enum('Awaiting Screening','Available','Reserved','Issued','Expired','Discarded') NOT NULL,
  `changed_by` int(10) unsigned DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_blood_unit_history_unit` (`blood_unit_id`),
  KEY `fk_blood_unit_history_changed_by` (`changed_by`),
  CONSTRAINT `fk_blood_unit_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_blood_unit_history_unit` FOREIGN KEY (`blood_unit_id`) REFERENCES `blood_units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `blood_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blood_units` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `unit_code` varchar(50) NOT NULL,
  `hospital_id` int(10) unsigned NOT NULL,
  `donation_id` int(10) unsigned NOT NULL,
  `donor_id` int(10) unsigned NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `collection_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `status` enum('Awaiting Screening','Available','Reserved','Issued','Expired','Discarded') NOT NULL DEFAULT 'Awaiting Screening',
  `released_by` int(10) unsigned DEFAULT NULL,
  `released_at` datetime DEFAULT NULL,
  `discarded_by` int(10) unsigned DEFAULT NULL,
  `discarded_at` datetime DEFAULT NULL,
  `discard_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_unit_code` (`unit_code`),
  UNIQUE KEY `unique_donation_blood_unit` (`donation_id`),
  KEY `idx_blood_unit_hospital` (`hospital_id`),
  KEY `idx_blood_unit_donor` (`donor_id`),
  KEY `idx_blood_unit_group` (`blood_group`),
  KEY `idx_blood_unit_status` (`status`),
  KEY `idx_blood_unit_expiry` (`expiry_date`),
  KEY `fk_blood_unit_released_by` (`released_by`),
  KEY `fk_blood_unit_discarded_by` (`discarded_by`),
  CONSTRAINT `fk_blood_unit_discarded_by` FOREIGN KEY (`discarded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_blood_unit_donation` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_blood_unit_donor` FOREIGN KEY (`donor_id`) REFERENCES `donor_profiles` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_blood_unit_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_blood_unit_released_by` FOREIGN KEY (`released_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `donation_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `donation_status_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `donation_id` int(10) unsigned NOT NULL,
  `old_status` enum('Pending','Approved','Completed','Incomplete') DEFAULT NULL,
  `new_status` enum('Pending','Approved','Completed','Incomplete') NOT NULL,
  `changed_by` int(10) unsigned DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_donation_history_donation` (`donation_id`),
  KEY `fk_donation_history_changed_by` (`changed_by`),
  CONSTRAINT `fk_donation_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_donation_history_donation` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `donations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `donations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` int(10) unsigned NOT NULL,
  `donor_id` int(10) unsigned NOT NULL,
  `appointment_id` int(10) unsigned DEFAULT NULL,
  `donation_reference` varchar(50) NOT NULL,
  `donation_date` date NOT NULL,
  `status` enum('Pending','Approved','Completed','Incomplete') NOT NULL DEFAULT 'Pending',
  `entry_method` enum('Appointment','Walk-in','Manual') NOT NULL DEFAULT 'Manual',
  `recorded_by` int(10) unsigned DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_donation_reference` (`donation_reference`),
  UNIQUE KEY `unique_appointment_donation` (`appointment_id`),
  KEY `idx_donation_hospital` (`hospital_id`),
  KEY `idx_donation_donor` (`donor_id`),
  KEY `idx_donation_date` (`donation_date`),
  KEY `idx_donation_status` (`status`),
  KEY `fk_donation_recorded_by` (`recorded_by`),
  CONSTRAINT `fk_donation_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_donation_donor` FOREIGN KEY (`donor_id`) REFERENCES `donor_profiles` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_donation_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_donation_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `donor_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `donor_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `registration_hospital_id` int(10) unsigned NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `date_of_birth` date NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `genotype` varchar(10) NOT NULL,
  `address` varchar(255) NOT NULL,
  `available_for_donation` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_donor_user` (`user_id`),
  KEY `fk_donor_registration_hospital` (`registration_hospital_id`),
  CONSTRAINT `fk_donor_registration_hospital` FOREIGN KEY (`registration_hospital_id`) REFERENCES `hospitals` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_donor_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `status` enum('New','Reviewed','Resolved') NOT NULL DEFAULT 'New',
  `reviewed_by` int(10) unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `admin_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_feedback_status` (`status`),
  KEY `idx_feedback_created` (`created_at`),
  KEY `fk_feedback_reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_feedback_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `hospital_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hospital_status_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` int(10) unsigned NOT NULL,
  `old_status` enum('Pending','Approved','Rejected','Suspended') DEFAULT NULL,
  `new_status` enum('Pending','Approved','Rejected','Suspended') NOT NULL,
  `changed_by` int(10) unsigned DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_hospital_status_history_hospital` (`hospital_id`),
  KEY `fk_hospital_status_history_changed_by` (`changed_by`),
  CONSTRAINT `fk_hospital_status_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_hospital_status_history_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `hospitals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hospitals` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `address` varchar(255) NOT NULL,
  `state` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `contact_name` varchar(150) NOT NULL,
  `contact_email` varchar(150) NOT NULL,
  `status` enum('Pending','Approved','Rejected','Suspended') NOT NULL DEFAULT 'Pending',
  `rejection_reason` text DEFAULT NULL,
  `suspension_reason` text DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `suspended_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_hospital_email` (`email`),
  KEY `idx_hospitals_status` (`status`),
  KEY `idx_hospitals_state` (`state`),
  KEY `idx_hospitals_city` (`city`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `recipient_user_id` int(10) unsigned NOT NULL,
  `sent_by` int(10) unsigned DEFAULT NULL,
  `notification_type` enum('Donation Invitation','Appointment Update','Donation Update','Appreciation','Blood Request Update','Seasonal Greeting','General','Personnel Notice') NOT NULL DEFAULT 'General',
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `delivery_channel` enum('SMS','Email','Both') NOT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `email_address` varchar(150) DEFAULT NULL,
  `sms_status` enum('Not Selected','Pending','Sent','Failed') NOT NULL DEFAULT 'Not Selected',
  `email_status` enum('Not Selected','Pending','Sent','Failed') NOT NULL DEFAULT 'Not Selected',
  `sms_sent_at` datetime DEFAULT NULL,
  `email_sent_at` datetime DEFAULT NULL,
  `sms_error` text DEFAULT NULL,
  `email_error` text DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `blood_request_id` int(10) unsigned DEFAULT NULL,
  `donation_id` int(10) unsigned DEFAULT NULL,
  `appointment_id` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notification_recipient` (`recipient_user_id`),
  KEY `idx_notification_channel` (`delivery_channel`),
  KEY `idx_notification_created` (`created_at`),
  KEY `idx_notification_request` (`blood_request_id`),
  KEY `fk_notification_sender` (`sent_by`),
  KEY `fk_notification_donation` (`donation_id`),
  KEY `fk_notification_appointment` (`appointment_id`),
  CONSTRAINT `fk_notification_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notification_donation` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notification_recipient` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notification_request` FOREIGN KEY (`blood_request_id`) REFERENCES `blood_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notification_sender` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organisation_notice_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organisation_notice_recipients` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `notice_id` int(10) unsigned NOT NULL,
  `hospital_id` int(10) unsigned NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_notice_hospital` (`notice_id`,`hospital_id`),
  KEY `idx_notice_recipient_notice` (`notice_id`),
  KEY `idx_notice_recipient_hospital` (`hospital_id`),
  CONSTRAINT `fk_notice_recipient_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notice_recipient_notice` FOREIGN KEY (`notice_id`) REFERENCES `organisation_notices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organisation_notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organisation_notices` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sent_by` int(10) unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `notice_type` enum('General','Important','Policy','Operational') NOT NULL DEFAULT 'General',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_org_notice_sender` (`sent_by`),
  KEY `idx_org_notice_created` (`created_at`),
  CONSTRAINT `fk_org_notice_sender` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_reset_token_hash` (`token_hash`),
  KEY `idx_reset_user` (`user_id`),
  KEY `idx_reset_expiry` (`expires_at`),
  CONSTRAINT `fk_reset_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personnel_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personnel_permissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `personnel_user_id` int(10) unsigned NOT NULL,
  `permission` enum('MANAGE_DONORS','MANAGE_APPOINTMENTS','RECORD_DONATIONS','MANAGE_INVENTORY','PROCESS_BLOOD_REQUESTS','SEND_NOTIFICATIONS') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_personnel_permission` (`personnel_user_id`,`permission`),
  CONSTRAINT `fk_permission_personnel` FOREIGN KEY (`personnel_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personnel_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personnel_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `staff_number` varchar(50) DEFAULT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_personnel_user` (`user_id`),
  UNIQUE KEY `unique_staff_number` (`staff_number`),
  CONSTRAINT `fk_personnel_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `request_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `request_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `blood_request_id` int(10) unsigned NOT NULL,
  `old_status` enum('Submitted','Under Review','Approved','Ready for Collection','Completed','Rejected','Cancelled') DEFAULT NULL,
  `new_status` enum('Submitted','Under Review','Approved','Ready for Collection','Completed','Rejected','Cancelled') NOT NULL,
  `changed_by` int(10) unsigned DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_request_history_request` (`blood_request_id`),
  KEY `fk_request_history_changed_by` (`changed_by`),
  CONSTRAINT `fk_request_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_request_history_request` FOREIGN KEY (`blood_request_id`) REFERENCES `blood_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `seeker_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seeker_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_seeker_user` (`user_id`),
  CONSTRAINT `fk_seeker_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` int(10) unsigned DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('organisation_admin','hospital_admin','personnel','donor','seeker') NOT NULL,
  `account_status` enum('Active','Inactive','Disabled') NOT NULL DEFAULT 'Active',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_email` (`email`),
  KEY `idx_users_hospital` (`hospital_id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`account_status`),
  CONSTRAINT `fk_users_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

