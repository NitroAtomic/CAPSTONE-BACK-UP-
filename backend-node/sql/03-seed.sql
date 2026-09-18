-- ============================================================
-- Backend and integration: IamAtomic
-- 03 - Seed data
-- Run AFTER 01-jyan-base-schema.sql and 02-backend-additions.sql
--
-- Loads the six free modules and four premium modules that match the
-- actual module pages in the frontend repo. Slugs here must match the
-- HTML filenames under modules/ exactly, or the pages won't link up.
-- ============================================================

USE `awareness_platform`;

INSERT INTO `module` (module_title, slug, description, module_type, category) VALUES
  ('Quishing', 'quishing', 'Email phishing, fake login pages, and QR code exploits.', 'Free', 'quishing'),
  ('Spear Phishing', 'spear-phishing', 'Targeted attacks using real details about you or your work.', 'Free', 'spear-phishing'),
  ('Smishing', 'smishing', 'Scam text messages and mobile messaging attacks.', 'Free', 'smishing'),
  ('Vishing', 'vishing', 'Voice phishing and social engineering phone calls.', 'Free', 'vishing'),
  ('Pretexting', 'pretexting', 'A fabricated scenario used to get access or information.', 'Free', 'pretexting'),
  ('Essential Safe Practices for Remote Environments', 'essential-safe-practices-remote-environments', 'Essential safe practices for remote work environments.', 'Free', 'safe-practices'),
  ('Client Impersonation', 'client-impersonation', 'Someone posing as your real client mid-project.', 'Premium', 'role-based'),
  ('Invoice and Payment Scams', 'invoice-scams', 'Spoofed payment confirmations and redirected invoices.', 'Premium', 'role-based'),
  ('Fake Job and Recruiter Offers', 'fake-recruiters', 'Recruitment scams targeting freelancers and VAs.', 'Premium', 'role-based'),
  ('Secure Client Data Handling', 'client-data', 'Protecting client data, passwords, and files from exposure.', 'Premium', 'role-based');

-- One quiz per module. number_of_questions starts at 0 and is updated
-- whenever questions are added through the admin panel.
INSERT INTO `quiz` (module_id, title, number_of_questions)
SELECT module_id, CONCAT(module_title, ' Quiz'), 0 FROM `module`;

-- ============================================================
-- Creating the first admin account:
--   1. Register normally through the site or POST /api/auth/register
--   2. UPDATE `user` SET role = 'admin' WHERE email = 'your@email.com';
-- There is deliberately no self-service way to become an admin.
-- ============================================================
