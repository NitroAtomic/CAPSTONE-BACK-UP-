-- ============================================================
-- Backend and integration: IamAtomic
-- 04 - Quiz question seed data (DB-backed admin editor)
-- Run AFTER 01, 02, and 03.
--
-- This does NOT feed the live student-facing quizzes -- those are scored
-- client-side from the bundled javascript/framework/vue/data/module-N.json
-- files (120 questions total, transcribed from the official Capstone 2
-- Content Module Documentation), and never touch this table.
--
-- What this DOES feed: the admin "Quiz questions" panel (FR-18) and the
-- POST /api/quizzes/:quizId/submit server-side scoring path, both of which
-- read/write `quizquestion`. Without this file that table -- and that whole
-- admin screen -- started out completely empty.
--
-- IMPORTANT LIMITATION, read before assuming full parity with the paper:
-- `quizquestion.correct_option_index` is a single INT and the admin form
-- hardcodes exactly 4 options. The real 120-question bank in module-N.json
-- also has True/False questions (2 options) and multi-select questions
-- (more than one correct answer), neither of which this schema/admin UI can
-- represent. Those are intentionally NOT seeded here rather than silently
-- truncated or forced into a shape that would score wrong. Counts per module:
--
--   Module 1 (Quishing): 9 seeded, 11 skipped (2-option or multi-select)
--   Module 2 (Spear Phishing): 10 seeded, 10 skipped (2-option or multi-select)
--   Module 3 (Smishing): 12 seeded, 8 skipped (2-option or multi-select)
--   Module 4 (Vishing): 12 seeded, 8 skipped (2-option or multi-select)
--   Module 5 (Pretexting): 12 seeded, 8 skipped (2-option or multi-select)
--   Module 6 (Essential Safe Practices for Remote Environments): 11 seeded, 9 skipped (2-option or multi-select)
--   TOTAL: 66 seeded, 54 skipped out of 120
--
-- If the team wants the admin panel to cover the full 120-question bank,
-- that needs a schema change first (correct_option_index -> a JSON list of
-- correct indices, plus an admin UI that supports 2-6 options per question).
-- Flagging this now so it's a documented decision, not a surprise later.
--
-- Uses plain INSERT ... SELECT (one statement per question) rather than a
-- multi-row VALUES table constructor, so this runs the same way on MySQL
-- and MariaDB without depending on version-specific SQL syntax.
-- ============================================================

USE `awareness_platform`;

-- Module 1: Quishing (9 questions)
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the primary objective of an email phishing attack targeting remote employees?', '["To test home internet connection speeds", "To trick users into revealing credentials, sensitive data, or executing unauthorized actions", "To automatically upgrade operating system software", "To clean junk files from a local hard drive"]', 1, 0
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'quishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What does the term "Quishing" refer to in modern cybersecurity?', '["Sending phishing attempts via voice phone calls", "Hacking smart television devices", "Using malicious QR codes to conceal phishing URLs and bypass security filters", "Encrypting databases using ransomware"]', 2, 1
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'quishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Which domain name represents an example of "typosquatting"?', '["support.google.com", "login.microsoft.com", "security-update@micros0ft-verify.com", "portal.slack.com"]', 2, 2
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'quishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You receive an email from IT-Support@company-desk.net stating: "Your password expires in 10 minutes. Click here to retain your current password." What should you do first?', '["Click the link immediately to prevent losing account access", "Forward the email to your personal account so you don\'t lose the link", "Pause, do not click the link, and verify the sender address against official internal IT contacts", "Reply to the email providing your current password so IT can fix it for you"]', 2, 3
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'quishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Why do quishing attacks often succeed when targeting remote employees?', '["Smartphones cannot connect to Wi-Fi networks", "Scanning the QR code shifts the browsing session to a mobile device outside the company\'s desktop security monitoring", "QR codes automatically disable smartphone antivirus apps", "Mobile screens automatically encrypt all user passwords"]', 1, 4
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'quishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the safest way to access a company cloud portal after receiving a suspicious email notification?', '["Click the link in the email, enter credentials, then log out", "Open a fresh browser tab, type the verified official URL manually or use a saved bookmark", "Reply to the email asking if the link is safe", "Copy and paste the link into a personal social media post to ask colleagues"]', 1, 5
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'quishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'A virtual assistant receives an email displaying the company CEO’s exact name and profile photo. The sender address is ceo-office@exec-mail-corp.com (not the corporate @company.com domain). The message requests an urgent purchase of gift card vouchers for an ongoing client event. What social engineering tactic is being deployed?', '["Mass Ransomware Distribution", "Executive Spoofing via Combosquatting Phishing", "Authorized Corporate Expense Request", "Automated Database Synchronization"]', 1, 6
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'quishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the primary reason threat actors exploit human curiosity or urgency during a phishing attempt?', '["To test the bandwidth limitations of home routers", "To trigger fast, emotional decision-making that bypasses logical identity verification", "To force web browsers to automatically clear local cache files", "To shorten the length of domain URLs"]', 1, 7
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'quishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'A remote software engineer receives an email containing a link to a "Critical Security Patch" hosted on github-downloads-security.net. What is the most rigorous way to confirm if this patch is legitimate?', '["Click the link, download the file, and scan it with a free online tool", "Check official internal engineering channels (e.g., internal Slack/Teams or company repo) and consult the lead system administrator", "Forward the email to external contacts on LinkedIn to ask if they received it", "Reply directly asking the sender for their corporate employee ID number"]', 1, 8
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'quishing';

-- Module 2: Spear Phishing (10 questions)
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'How does spear phishing differ from generic mass phishing?', '["Spear phishing is automated using pop-up advertisements", "Spear phishing is highly targeted at a specific individual or team using researched details", "Spear phishing only targets mobile phones using text messages", "Spear phishing requires physical entry into an office building"]', 1, 0
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What does the acronym "OSINT" stand for in cybersecurity reconnaissance?', '["Operational System Internal Network Tracking", "Open Source Intelligence", "Optical Security Inspection for Network Traffic", "Offline Storage Integration and Networking Tool"]', 1, 1
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Why do attackers often send password-protected .zip files containing malicious attachments?', '["To save hard drive storage space on remote laptops", "To prevent email security gateways from scanning the encrypted contents for malware", "To make the file download faster over home Wi-Fi networks", "Because password protection automatically executes scripts"]', 1, 2
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You are a remote graphic designer. You receive a direct message on Telegram from someone claiming to be a senior manager at your main client account, asking you to open Design_Brief.pdf.exe. How should you react?', '["Open the file immediately since it contains \\"pdf\\" in the filename", "Do not open the file; the double extension (.pdf.exe) indicates an executable file", "Rename the file to .doc and then double-click it", "Forward the file to a friend on personal social media"]', 1, 3
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What technical feature makes MITRE ATT&CK Technique T1566.001 particularly dangerous to enterprise endpoint security?', '["It uses physical USB drives dropped in parking lots", "It relies on user execution of attached files to run malware inside the local user environment", "It automatically changes home router DNS addresses without user interaction", "It turns off laptop Wi-Fi adapters permanently"]', 1, 4
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What information can an attacker gather from your public GitHub profile to make a spear-phishing email believable?', '["Your private home Wi-Fi password", "Programming languages used, active repositories, and collaborator usernames", "Your hardware MFA seed keys", "Your credit card PIN"]', 1, 5
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'A freelancer receives a high-paying offer on Upwork. The client insists on sending an .iso file containing "project assets" before contract signing. Why is this suspicious?', '[".iso files are standard image files that cannot contain text.", "An .iso file is a disk image that can bypass basic scanner checks and mount an executable drive on Windows/Mac.", "Freelancers are legally prohibited from receiving .iso files.", ".iso files automatically delete the operating system upon opening."]', 1, 6
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What step should you take before opening a password-protected .zip file from an external party?', '["Open it on a personal device to protect work systems.", "Verify the source out-of-band and inspect unzipped contents in an isolated environment or sandbox.", "Forward the password to your bank.", "Disable your endpoint firewall."]', 1, 7
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What term describes altering sender details so an email appears to come from a legitimate internal colleague?', '["Port forwarding", "Email Header Spoofing", "Hard drive partitioning", "Disk defragmentation"]', 1, 8
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'An email claiming to be from your company\'s HR department contains a link to "Updated W-2 Tax Forms." The link URL points to http://hr-portal.tax-verify-auth.com. What is the safest course of action?', '["Click the link and enter your Social Security Number.", "Hover over the link, identify the external domain, do not click, and report it to security/HR.", "Email your password to HR to check for you.", "Ignore all future HR emails forever."]', 1, 9
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'spear-phishing';

-- Module 3: Smishing (12 questions)
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What does the term "Smishing" stand for?', '["Secure Mail Phishing", "SMS Phishing (Short Message Service Phishing)", "Software Management Phishing", "System Media Injection"]', 1, 0
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You receive a text message: *"USPS Alert: Your package cannot be delivered due to an incorrect house number. Update info here: bit.ly/3xY9zQ"*. You are expecting a package. What is the correct action?', '["Tap the link immediately and enter your home address.", "Do not tap the link; open your official USPS app or browser bookmark independently to track the package.", "Reply \\"STOP\\" to check if the sender is real.", "Text back your credit card details."]', 1, 1
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Why are mobile browsers particularly vulnerable to web link deceptive techniques?', '["Mobile screens automatically block HTTPS connections.", "Mobile screens have limited space, often truncating or hiding the full URL bar and security indicators.", "Smartphones cannot run web browsers.", "Mobile networks disable domain name resolution."]', 1, 2
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You attempt to log into your work portal. A minute later, you receive a text: *"IT Helpdesk: We detected an abnormal login. Reply YES with the code you just received to block the login."* What is happening?', '["IT is securely helping you protect your account.", "An attacker triggered your real login prompt and is trying to trick you into texting them your OTP.", "Your phone has a hardware virus that generates text messages.", "Your mobile service provider is upgrading its network towers."]', 1, 3
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the risk of using shortened URLs (bit.ly, tinyurl) in SMS messages?', '["They consume extra mobile data.", "They obscure the actual destination domain, making it impossible to evaluate safety at a glance.", "They automatically install viruses without user interaction.", "They disable mobile touchscreen responsiveness."]', 1, 4
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What technology allows scammers to change the phone number or name displayed on your mobile incoming text screen?', '["OAuth 2.0", "Caller ID / Alpha-Numeric Sender ID Spoofing", "Transport Layer Security", "Fiber Optic Splicing"]', 1, 5
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'A remote worker receives a text message: *"HR ALERT: Update your direct deposit bank details at* *https://payroll-portal-update.com* *before 5 PM to receive this week\'s paycheck."* What should the worker check first?', '["Tap the link and enter the old bank account number.", "Verify the URL against official company payroll bookmarks and contact HR via official email/call.", "Post a screenshot of the link on personal social media.", "Reply with credit card credentials."]', 1, 6
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What shortcode number can users in many regions forward spam or smishing texts to for reporting?', '["911", "7726 (SPAM)", "411", "0000"]', 1, 7
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Which mobile security practice best protects against smishing attacks seeking to compromise work accounts?', '["Transitioning from SMS-based MFA to mobile authenticator apps (TOTP) or hardware keys.", "Disabling screen auto-lock.", "Saving all passwords in plain text notes on the phone.", "Connecting to open public Wi-Fi networks without encryption."]', 0, 8
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You receive a WhatsApp text from an unknown international number displaying your company logo: *"Hi, I am John from Corporate IT. We are updating mobile profiles. Click this link to install our security certificate."* How should you respond?', '["Install the certificate immediately.", "Ignore and report the WhatsApp message; IT does not deploy security certificates via unsolicited WhatsApp texts.", "Send the sender your personal national ID card.", "Ask the sender to call your personal home phone."]', 1, 9
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the safest action to take when receiving a suspicious text message?', '["Tap the link to see where it leads.", "Delete the message, report it, and do not click any links.", "Forward the message to 10 friends.", "Call the unknown number and insult the caller."]', 1, 10
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'A text message reads: *"Bank Alert: Fraud detected. Call 1-800-555-0199 immediately to cancel the transaction."* What is the safest way to call your bank?', '["Call the 1-800 number provided in the text message.", "Call the customer service number printed on the back of your official payment card or official site.", "Wait 3 weeks and check your mailbox.", "Text the number back asking for the caller\'s name."]', 1, 11
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'smishing';

-- Module 4: Vishing (12 questions)
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is "Vishing"?', '["Video Phishing via webcam feeds.", "Voice Phishing conducted via telephone calls or VoIP systems.", "Virtual Firewall scanning.", "Vector Analysis of server logs."]', 1, 0
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You receive a call from "Corporate IT Support" stating your laptop is infected. The caller instructs you to go to a website and install AnyDesk so they can clean the machine. What should you do?', '["Install AnyDesk immediately to fix the laptop.", "Decline the request, hang up, and verify the incident through official internal IT channels.", "Give the caller your banking credentials instead.", "Leave your laptop running and walk away."]', 1, 1
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Why is voice interaction (vishing) particularly effective at tricking targets compared to email?', '["Phone calls cannot be recorded.", "Real-time vocal conversations create high cognitive pressure and leave little time for independent verification.", "Emails are always blocked by antivirus software.", "Voice calls automatically bypass password controls."]', 1, 2
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'An incoming call displays your bank\'s exact toll-free phone number. The caller states: *"Security Alert: A $900 transfer was attempted. Read the code we just sent your phone to cancel it."* What should you do?', '["Read the code to the caller.", "Hang up immediately, find the official phone number on your physical payment card, and call the bank directly.", "Press 9 to transfer to police.", "Give the caller your Social Security Number."]', 1, 3
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What term describes repeated, automated MFA push prompts sent to a user’s phone to force them into tapping "Approve" out of frustration?', '["Denial of Service", "MFA Fatigue / Push Bombing", "Port Scanning", "SQL Injection"]', 1, 4
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the primary objective of a vishing attacker who convinces a remote employee to install Quick Assist or TeamViewer?', '["To upgrade the computer\'s monitor resolution.", "To establish an active remote control session to exfiltrate files and pivot into corporate networks.", "To improve local Wi-Fi speeds.", "To automatically clear browser cache."]', 1, 5
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'A caller claims to be from the internal finance team: *"I am processing your remote equipment reimbursement, but the system is throwing an error. What is your full bank account and routing number?"* How should you respond?', '["Provide the numbers verbally.", "Decline to share bank details over the phone and direct the inquiry to the official HR/Finance portal.", "Give your credit card CVV number instead.", "Hang up and delete your operating system."]', 1, 6
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the best immediate response when an unknown caller becomes aggressive and demands immediate compliance?', '["Comply with their demands to avoid trouble.", "Terminate the call (hang up) and report the incident to security.", "Apologize and offer your personal credentials.", "Hold the line for 5 hours without speaking."]', 1, 7
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Which technique helps mitigate the risk of Caller ID spoofing when receiving unexpected internal calls?', '["Trusting the Caller ID name unconditionally.", "Independent Out-of-Band Callbacks using verified internal directory numbers.", "Turning off smartphone Bluetooth.", "Disabling mobile flight mode."]', 1, 8
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You receive an unexpected call: *"This is Executive Assistant Claire calling on behalf of CEO Mark. He needs you to purchase five digital gift cards right now for a client meeting."* What red flag is present?', '["Requests for digital gift cards combined with executive authority impersonation and urgency.", "The caller used proper grammar.", "The call occurred during business hours.", "The caller knew the CEO\'s name."]', 0, 9
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What should a remote worker do if they accidentally approve a fraudulent MFA push prompt during a vishing call?', '["Keep quiet and hope no one notices.", "Immediately report the incident to security, trigger an account password reset, and revoke active sessions.", "Turn off the computer and throw it away.", "Send a text to the scammer asking them to log out."]', 1, 10
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Which department should a remote employee contact to report a suspicious vishing call impersonating internal staff?', '["Local Sanitation Department", "Enterprise Security / IT Security Incident Response Team", "Public Library", "The caller\'s personal number"]', 1, 11
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'vishing';

-- Module 5: Pretexting (12 questions)
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the primary characteristic of a pretexting attack?', '["Bombarding a website with fake internet traffic.", "Fabricating a scenario and identity to build trust and trick a victim into sharing data.", "Infecting USB drives left in public parking lots.", "Sending mass generic spam to millions of emails."]', 1, 0
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Someone claiming to be an "External ISO Auditor" contacts a remote worker asking for a complete list of internal server IP addresses. The caller says opening an IT ticket will take too long. What should the worker do?', '["Email the server IP list immediately.", "Insist on routing the request through official internal ticketing and manager approval channels.", "Post the server IP addresses on social media.", "Give the auditor their home Wi-Fi password."]', 1, 1
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Why do pretexters often try to discourage victims from submitting official IT service tickets?', '["IT tickets cost money to create.", "Official tickets trigger administrative logs and security reviews that would expose the fake identity.", "IT ticketing systems automatically block phone calls.", "Scammers prefer using postal mail."]', 1, 2
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You receive a message from a "new vendor" asking for internal directory structures so they can "prepare project integration." You have not received any notification from management about a new vendor. What is the correct protocol?', '["Send the directory file immediately.", "Do not share internal data; verify the vendor’s onboarding status with your internal manager or procurement team.", "Ask the vendor to pay you $50.", "Send them dummy data containing real employee passwords."]', 1, 3
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'How does pretexting differ from mass phishing?', '["Pretexting uses malicious email attachments exclusively.", "Pretexting focuses on building a credible narrative and relationship, whereas mass phishing relies on broad, generic lures.", "Mass phishing only targets phone landlines.", "Pretexting is legally permitted in business."]', 1, 4
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What term describes an attacker engaging a victim in casual conversation over several days to establish a sense of normal friendship before executing a scam?', '["Buffer Overflow", "Trust-Building / Slow-Burn Pretexting", "Man-in-the-Middle", "Zero-Day Exploit"]', 1, 5
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'A remote contractor receives an email from someone claiming to be "Head of Global Security": *"We are running a silent security exercise. Do not inform your supervisor. Send your current VPN credentials directly to this email."* What should the contractor do?', '["Follow instructions and keep quiet.", "Ignore the secrecy request and immediately report the message to their official supervisor and security team.", "Reply asking for a cash reward.", "Post the VPN credentials on an online forum."]', 1, 6
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What structural control prevents pretexting attempts from compromising internal resources?', '["Allowing employees to share passwords freely.", "Enforcing strict adherence to official identity verification and ticketing channels.", "Removing password locks from work laptops.", "Disabling all antivirus software."]', 1, 7
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What should you do if an external party claiming to be an auditor asks for employee home addresses?', '["Send the addresses in a plain text file.", "Refuse and escalate the inquiry to your company\'s official legal or HR department.", "Ask for $10 per address.", "Guess the addresses and send random data."]', 1, 8
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'A remote worker receives a call from an individual claiming to be a printer technician needing internal Wi-Fi passwords to fix an office printer 500 miles away. Why is this request suspicious?', '["Printers do not use electricity.", "The scenario lacks logical plausibility, and Wi-Fi credentials should never be shared verbally with external technicians.", "Technicians only speak French.", "Wi-Fi passwords cannot be typed on laptops."]', 1, 9
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What role does flattery play in pretexting interactions?', '["It encrypts the user\'s hard drive.", "It lowers the victim\'s defenses by making them feel valued and eager to assist.", "It speeds up internet connection bandwidth.", "It triggers automated firewall logging."]', 1, 10
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the gold standard rule when handling requests for sensitive corporate information?', '["Share the data if the caller sounds friendly.", "Verify identity and authorization through official channels before releasing any data.", "Always post data on public forums.", "Never talk to anyone at work."]', 1, 11
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'pretexting';

-- Module 6: Essential Safe Practices for Remote Environments (11 questions)
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Why is SMS-based Multi-Factor Authentication (MFA) considered less secure than authenticator apps?', '["SMS text messages cost money to receive.", "SMS messages can be intercepted via SIM-swapping, smishing, or cellular network exploitation.", "Authenticator apps require an active satellite connection.", "SMS codes only work on desktop computers."]', 1, 0
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You accidentally enter your work password on a suspicious website landing page. What is the FIRST technical action you should take?', '["Restart your home router.", "Immediately disconnect your computer from Wi-Fi/Ethernet and report the incident to security/IT to reset credentials.", "Wait 48 hours to see if someone logs in.", "Delete your web browser icon."]', 1, 1
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the risk of keeping factory default administrative credentials on your home Wi-Fi router?', '["It reduces internet download speed by 50%.", "Default credentials are publicly known, allowing attackers to compromise the router and intercept traffic.", "Routers automatically turn off after 24 hours if defaults are kept.", "It prevents mobile phones from connecting."]', 1, 2
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'A client emails asking you to wire project funds to a new bank account. The email comes from the client\'s real address. What is the safest out-of-band verification step?', '["Reply to the email asking: *\\"Is this account really yours?\\"*", "Call the client on a phone number verified from your original signed contract to confirm the change verbally.", "Wire half the money first to test the account.", "Send the money via cryptocurrency instead."]', 1, 3
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the primary purpose of a Password Manager for remote workers?', '["To share passwords publicly with friends.", "To generate and securely store unique, complex passwords for every account, mitigating credential stuffing risks.", "To automatically bypass MFA prompts.", "To speed up Wi-Fi processing."]', 1, 4
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'Which wireless encryption standard provides the strongest security for home Wi-Fi networks?', '["WEP (Wired Equivalent Privacy)", "WPA3 (Wi-Fi Protected Access 3)", "Plain HTTP", "WPA1"]', 1, 5
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You are working remotely from a coffee shop. What tool should you use to encrypt your internet traffic before connecting to the open public Wi-Fi?', '["Public BitTorrent client", "Virtual Private Network (VPN) or encrypted tunnel", "Incognito browser tab", "Adobe Acrobat Reader"]', 1, 6
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What should you do with unused smart home devices connected to your primary work Wi-Fi network?', '["Move them to an isolated Guest Network or update/disable unused connectivity.", "Share their IP addresses on social media.", "Connect them directly to your work laptop via USB.", "Turn off your laptop firewall."]', 0, 7
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'You notice a USB flash drive sitting on your home office desk. You do not remember buying it or where it came from. What should you do?', '["Plug it into your work laptop to see what files are on it.", "Do not plug it into your laptop; report untrusted media to IT or safely dispose of it.", "Give it to a neighbor to test on their computer.", "Format it while holding it in your hands."]', 1, 8
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What feature in web browsers helps protect users from accessing known malicious websites?', '["Auto-play video settings", "Built-in Phishing and Malware Protection (e.g., Safe Browsing filters)", "Custom font downloads", "Cookie clear timers"]', 1, 9
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';
INSERT INTO `quizquestion` (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id, 'What is the safest way to store physical backup codes for your account MFA?', '["Stick them on a Post-it note attached to your computer monitor.", "Store them in a secure location, such as an encrypted password manager or secure physical safe.", "Post them on a public web page.", "Email them to an unknown address."]', 1, 10
FROM `quiz` q JOIN `module` m ON m.module_id = q.module_id WHERE m.slug = 'essential-safe-practices-remote-environments';

UPDATE `quiz` q SET number_of_questions = (SELECT COUNT(*) FROM `quizquestion` qq WHERE qq.quiz_id = q.quiz_id);
