<template>
  <main class="module-page">
    <header class="module-header">
        <nav>
            <router-link to="/" class="home">
                <span class="icon">🏠</span>Home
            </router-link>
        </nav>

        <h1>Spear Phishing & Targeted Digital Surveillance</h1>
        <p>Module 2 of 6</p>
    </header>


    <!-- =========================
         Spear Phishing Learning Guide
         ========================= -->

    <section
        id="spear-phishing-awareness-guide"
        class="module-awareness-guide"
    >
        <p class="module-key-details">
            <strong>Target Audience:</strong> Remote personnel with system
            access, administrative privileges, financial responsibilities,
            or public social media profiles.
        </p>

        <article>
            <h2>Explicit Learning Objectives:</h2>

            <p>After completing this module, the learner will be able to:</p>

            <ul>
                <li>
                    Differentiate between broad mass phishing and targeted,
                    reconnaissance-driven spear phishing.
                </li>

                <li>
                    Identify how threat actors use Open Source Intelligence
                    (OSINT) gathered from public platforms (LinkedIn, GitHub,
                    X) to craft personalized lures.
                </li>

                <li>
                    Recognize execution risks associated with macro-enabled
                    attachments, double file extensions, and out-of-band
                    messaging channels.
                </li>
            </ul>
        </article>

    </section>


    <section>
        <h2>Core Reading Material & Article Content</h2>

        <article>
            <h3>The Mechanics of Spear Phishing</h3>

            <p>
                Mass phishing relies on broad distribution, sending
                thousands of identical, generic messages hoping a small
                percentage of recipients click. In contrast, spear phishing
                is a targeted, asymmetric attack focused on a specific
                individual, team, or organization.
            </p>

            <p>
                Because spear phishing messages reference real names,
                current client engagements, internal software platforms, or
                recent company events, the victim's psychological threshold
                to suspect deception is significantly lower.
            </p>
        </article>

        <figure>
            <img src="/images/OSINT-for-Targeted-Spear-Phishing-Process-Flow.png" alt="Diagram showing three Open Source Intelligence sources feeding into a customized spear phishing message: a LinkedIn profile revealing job role, work experience, and connections; a GitHub repository revealing projects, code and technologies, and commit history; and Social Media/X revealing posts, activity patterns, and tools or technologies mentioned. All three funnel into a single result labeled Customized Spear Phishing Targeted Communication.">
            <figcaption>Attackers combine details pulled from LinkedIn, GitHub, and social media/X profiles to assemble a single, highly convincing spear phishing message aimed at one specific target.</figcaption>
        </figure>

        <article>
            <h3>Open Source Intelligence (OSINT) Reconnaissance</h3>

            <p>
                Before sending a single email, a spear phisher conducts
                detailed reconnaissance using publicly accessible data:
            </p>

            <ul>
                <li>
                    <strong>LinkedIn:</strong> Maps corporate reporting
                    hierarchies, job titles, active projects, and vendor
                    relationships.
                </li>

                <li>
                    <strong>GitHub / Technical Blogs:</strong> Identifies
                    specific programming frameworks, internal repository
                    names, and outdated software dependencies used by a
                    company's engineering team.
                </li>

                <li>
                    <strong>Social Media / X:</strong> Tracks employee
                    vacation schedules, conference attendance, or remote
                    work locations.
                </li>
            </ul>

            <p>
                Using this OSINT, an attacker might draft an email appearing
                to come from a real co-worker currently attending a
                conference, referencing a real client project:
            </p>

            <p>
                <em>"Hi Alex, I'm at the TechSummit conference right now.
                Could you check the attached update for the Acme Corp
                project proposal? Password to unzip is 1234."</em>
            </p>
        </article>

        <article>
            <h3>Weaponized Attachments & Evasion</h3>

            <p>
                Spear phishing campaigns frequently deliver malicious
                payloads hidden inside weaponized files:
            </p>

            <ul>
                <li>
                    <strong>Macro-Enabled Office Documents (.docm, .xlsm):</strong>
                    Contain embedded Visual Basic for Applications (VBA)
                    scripts that download secondary malware
                    (trojans/infostealers) when macros are enabled.
                </li>

                <li>
                    <strong>Double Extensions (.pdf.exe, .docx.iso):</strong>
                    Operating systems often hide known extensions by
                    default. A file named Quarterly_Report.pdf.exe appears
                    to the user as Quarterly_Report.pdf.
                </li>

                <li>
                    <strong>Encrypted Archives (.zip, .rar, .7z):</strong>
                    Attackers encrypt the attached archive file and provide
                    the password in the email body. Because the gateway
                    cannot inspect the encrypted contents without the
                    password, the malicious attachment bypasses automated
                    perimeter scanners.
                </li>
            </ul>
        </article>

    </section>

    <article>
        <h2>Curated External Resources & References</h2>

        <ul>
            <li>
                <strong>Technical Taxonomy:</strong>
                <a href="https://attack.mitre.org/techniques/T1566/001/" target="_blank" rel="noopener noreferrer">
                    MITRE ATT&CK Framework — Phishing: Spearphishing Attachment (Technique T1566.001)
                </a>
            </li>

            <li>
                <strong>Research Survey:</strong> Birthriya, S. K., Ahlawat,
                P., & Jain, A. K. (2025). Detection and prevention of spear
                phishing attacks: A comprehensive survey.
                <em>Computers & Security</em>, 151, 104317.
            </li>

            <li>
                <strong>Security Advisory:</strong>
                <a href="https://www.cisa.gov/news-events/news/spear-phishing-threats-and-prevention" target="_blank" rel="noopener noreferrer">
                    CISA — Protecting Against Spear Phishing & OSINT Exploitation
                </a>
            </li>
        </ul>
    </article>

    <!-- =========================
         Module Quiz Section
         ========================= -->

    <section class="module-quiz-section">

        <h2>Test Your Knowledge</h2>

        <p>
            Ready to check what you've learned? Take a randomized
            10-question quiz based on this module.
        </p>

        <router-link to="/quiz/module-2/question" class="take-quiz-button">
            Take a Quiz
        </router-link>

    </section>

        <!-- =========================
         AI Chatbot
         ========================= -->
  </main>
</template>

<script src="./SpearPhishing.js"></script>
