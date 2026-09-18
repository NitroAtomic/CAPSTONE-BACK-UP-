-- ============================================================
-- Backend and integration: IamAtomic
-- 02 - Backend additions
-- Web-Based Social Engineering Awareness Platform for Remote Workers
-- Group 4 - Capstone 2
--
-- Run AFTER 01-jyan-base-schema.sql
--   mysql -u root < sql/01-jyan-base-schema.sql
--   mysql -u root < sql/02-backend-additions.sql
--
-- Jyan's schema is the base and is not modified -- it already matches the
-- ERD in our Capstone 1 paper. This file only adds the extra columns and
-- tables that specific features need in order to actually work. Each one
-- is explained below so it's reviewable, not just "extra stuff".
-- ============================================================

USE `awareness_platform`;


-- ------------------------------------------------------------
-- 1. user.role
--
-- Needed for: admin access checking on protected API routes.
--
-- Note: the `administrator` table from the base schema is kept as-is so the
-- ERD in the paper still matches. This column is what the backend actually
-- checks, because admins need to be part of the same login/session system
-- as everyone else -- otherwise we'd be maintaining two separate password
-- systems, which is more code and more places a password could leak.
--
-- To promote someone:
--   UPDATE `user` SET role = 'admin' WHERE email = 'their@email.com';
-- There is deliberately no self-service way to do this.
-- ------------------------------------------------------------
ALTER TABLE `user`
  ADD COLUMN `role` ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER `subscription_status`;


-- ------------------------------------------------------------
-- 2. quizresult.total
--
-- Needed for: the dashboard's average quiz score.
--
-- The base table stores `score` only. Without knowing how many questions
-- the quiz had, "8" is meaningless -- we can't tell 8/10 from 8/20, so the
-- average score on the dashboard can't be calculated. Storing the total
-- alongside the score also means changing a quiz's length later won't
-- silently corrupt older results.
-- ------------------------------------------------------------
ALTER TABLE `quizresult`
  ADD COLUMN `total` INT NOT NULL DEFAULT 10 AFTER `score`;


-- ------------------------------------------------------------
-- 3. awarenessassessment.weak_areas and .total
--
-- Needed for: FR-15 (recommended modules based on weak areas), and the
-- "weak areas" count shown on the dashboard.
--
-- The assessment identifies which topics the user got wrong. Without
-- somewhere to store that, the platform can't recommend the right modules
-- afterwards -- the recommendation feature simply has no input.
-- ------------------------------------------------------------
ALTER TABLE `awarenessassessment`
  ADD COLUMN `total` INT NOT NULL DEFAULT 15 AFTER `awareness_score`,
  ADD COLUMN `weak_areas` JSON NULL AFTER `awareness_level`,
  ADD COLUMN `by_topic` JSON NULL AFTER `weak_areas`;


-- ------------------------------------------------------------
-- 4. module.slug
--
-- Needed for: linking a module page (e.g. modules/phishing.html) to its
-- database row.
--
-- Without a stable slug, the frontend would have to match on module_title,
-- which breaks the moment an admin renames a module.
-- ------------------------------------------------------------
ALTER TABLE `module`
  ADD COLUMN `slug` VARCHAR(100) NULL AFTER `module_title`,
  ADD UNIQUE KEY `module_slug_unique` (`slug`);


-- ------------------------------------------------------------
-- 5. quizquestion
--
-- Needed for: storing quiz questions in the database instead of hardcoding
-- them in JavaScript, so the admin panel can actually edit them (FR-18).
--
-- This is a support table, the same way it would sit under Quiz in the ERD.
-- If the team decides quizzes stay hardcoded in the frontend for Capstone 2,
-- this table simply goes unused -- nothing else breaks.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quizquestion` (
  `question_id` INT NOT NULL AUTO_INCREMENT,
  `quiz_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `options` JSON NOT NULL,
  `correct_option_index` INT NOT NULL,
  `order_index` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`question_id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `quizquestion_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quiz` (`quiz_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ------------------------------------------------------------
-- 6. otpcode
--
-- Needed for: Premium two-step login verification, and password reset.
--
-- Codes are single-use, expire after 5 minutes, and lock out after 5 wrong
-- attempts. The `purpose` column keeps login codes and password-reset codes
-- separate, so a reset code can never be used to log in and vice versa.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `otpcode` (
  `otp_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `code_hash` VARCHAR(255) NOT NULL,
  `purpose` ENUM('login','password_reset') NOT NULL DEFAULT 'login',
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `attempts` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`otp_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `otpcode_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ------------------------------------------------------------
-- 7. progress: prevent duplicate rows
--
-- Without this, completing the same module twice creates two rows, and the
-- dashboard's "completed modules" count goes wrong. This lets the backend
-- safely upsert instead.
-- ------------------------------------------------------------
ALTER TABLE `progress`
  ADD UNIQUE KEY `progress_user_module_unique` (`user_id`, `module_id`);


-- ------------------------------------------------------------
-- Indexes for the dashboard queries ("get everything for this user")
-- ------------------------------------------------------------
CREATE INDEX `idx_quizresult_user` ON `quizresult` (`user_id`);
CREATE INDEX `idx_assessment_user` ON `awarenessassessment` (`user_id`);
CREATE INDEX `idx_progress_user` ON `progress` (`user_id`);
