<template>
  <main class="module-page">
    <header class="module-header">
        <nav>
            <router-link to="/" class="home">
                <span class="icon">🏠</span>Home
            </router-link>
        </nav>

        <h1>Vishing (Voice Phishing & Social Engineering Calls)</h1>
        <p>Module 4 of 6</p>
    </header>


    <!-- =========================
         Vishing Learning Guide
         ========================= -->

    <section
        id="vishing-awareness-guide"
        class="module-awareness-guide"
    >
        <h2>Module Metadata</h2>

        <p class="module-key-details">
            <strong>Target Audience:</strong> Remote workers in client
            support, phone-based operations, sales, executive support, or
            administrative roles.
        </p>

        <article>
            <h3>Explicit Learning Objectives:</h3>

            <p>After completing this module, the learner should be able to:</p>

            <ul>
                <li>
                    Analyze the technical mechanics of Caller ID spoofing
                    and VoIP-based voice manipulation.
                </li>

                <li>
                    Deconstruct how real-time vocal interactions induce
                    cognitive overload and compliance pressure.
                </li>

                <li>
                    Recognize common vishing pretexts, such as imposter IT
                    support desks, emergency financial holds, and
                    remote-management software installations.
                </li>

                <li>
                    Apply systematic identity verification protocols and
                    out-of-band phone confirmation workflows before sharing
                    credentials or approving access.
                </li>
            </ul>
        </article>

    </section>


    <section id="vishing-reading-material">
        <h2>Website Reading Material</h2>

        <article>
            <h3>1. The Threat of Voice Phishing (Vishing)</h3>

            <p>
                Vishing (Voice Phishing) uses phone calls or Voice over IP
                (VoIP) channels to trick targets into disclosing sensitive
                data, financial details, or granting system access. Unlike
                email or text-based attacks where a victim has time to
                review messaging syntax, real-time voice communications
                create intense conversational pressure.
            </p>
        </article>

        <article>
            <h3>2. Technical Tactics: Caller ID Spoofing & VoIP Platforms</h3>

            <p>
                Vishers exploit phone system protocols to alter the
                information displayed on a victim's incoming call screen:
            </p>

            <ul>
                <li>
                    <strong>Caller ID Spoofing:</strong> Attackers use
                    web-based VoIP services to manipulate the outbound
                    Caller ID metadata, making the call appear as if it
                    originates from an internal extension (e.g., "Corporate
                    IT Helpdesk" or "HQ Executive Office") or an official
                    bank customer service line.
                </li>

                <li>
                    <strong>Interactive Voice Response (IVR) Robocalls:</strong>
                    Attackers deploy automated phone menus ("Press 1 to
                    speak to our fraud department") to simulate legitimate
                    banking call centers before routing the victim to a
                    live scammer.
                </li>
            </ul>
        </article>

        <article>
            <h3>3. Psychological Manipulation & Cognitive Load</h3>

            <p>
                Voice communication allows threat actors to dynamically
                adapt their tactics based on a victim's tone and hesitation:
            </p>

            <ul>
                <li>
                    <strong>Artificial Urgency & Panic:</strong> Scammers
                    claim an active cyberattack or fraudulent transaction is
                    occurring right now, demanding immediate action.
                </li>

                <li>
                    <strong>Impersonation of Authority:</strong> The caller
                    assumes an authoritative persona (e.g., Senior Systems
                    Administrator, Financial Auditor, Executive Assistant)
                    to compel compliance.
                </li>

                <li>
                    <strong>High Cognitive Pressure:</strong> By creating a
                    fast-paced environment, the caller prevents the target
                    from stepping back to critically evaluate the
                    situation.
                </li>
            </ul>
        </article>

        <article>
            <h3>4. Common Vishing Pretexts targeting Remote Workers</h3>

            <ul>
                <li>
                    <strong>The IT Helpdesk "Password Reset" Call:</strong>
                    The caller claims your remote access account has
                    suspicious logins and asks you to read aloud an
                    incoming SMS OTP or approve a push notification.
                </li>

                <li>
                    <strong>Remote Management Tool Deployment:</strong> The
                    caller claims your laptop requires an urgent patch and
                    instructs you to download and execute remote
                    administration software (e.g., AnyDesk, TeamViewer,
                    Quick Assist). Once installed, the attacker gains full
                    remote control over your workstation.
                </li>
            </ul>
        </article>

        <article>
            <h3>5. Real-World Remote Work Scenario</h3>

            <p><strong>Scenario: The Fake IT Helpdesk Push Bombing Attack</strong></p>

            <p>
                Mark, a remote systems engineer, receives 15 consecutive
                MFA push notifications on his mobile phone at 10 PM.
                Seconds later, his phone rings. The Caller ID displays
                "Internal IT Operations."
            </p>

            <p>
                The voice on the line states: <em>"Hi Mark, this is Dave
                from IT SecOps. We see automated push alerts flooding your
                phone due to a gateway glitch. I am pushing one final
                prompt now—please tap 'Approve' to clear the queue so your
                account isn't locked overnight."</em>
            </p>

            <p>
                Stressed and tired, Mark taps "Approve." The caller was an
                attacker who possessed Mark's password and used vishing
                combined with push fatigue to bypass MFA.
            </p>
        </article>

        <article>
            <h3>6. Verification Protocols & Live Incident Safeguards</h3>

            <ol>
                <li>
                    <strong>Never Disclose Credentials or OTPs over the
                    Phone:</strong> Legitimate IT staff will never ask for
                    your password, PIN, or MFA codes over an incoming phone
                    call.
                </li>

                <li>
                    <strong>Hang Up and Call Back (Out-of-Band):</strong> If
                    a caller claims to represent an internal department or
                    bank, end the call immediately. Find the official phone
                    number from the internal company directory or card back
                    and call back independently.
                </li>

                <li>
                    <strong>Refuse Unsolicited Remote Software
                    Installs:</strong> Never install remote access software
                    (AnyDesk, TeamViewer) based on an inbound phone call.
                </li>
            </ol>
        </article>

    </section>

    <section id="vishing-red-flags">
        <h2>Red Flag Indicators & Defensive Checklist</h2>

        <ul>
            <li>
                <strong>Unsolicited Technical Support Calls:</strong>
                Incoming calls claiming to be "Internal IT" asking for
                system access or password disclosures.
            </li>

            <li>
                <strong>Demands for Remote Access Tools:</strong> Requests
                to download AnyDesk, TeamViewer, or LogMeIn during an
                unexpected phone call.
            </li>

            <li>
                <strong>Demands for MFA Verification:</strong> Callers
                asking you to approve a push notification or read aloud a
                One-Time Password.
            </li>

            <li>
                <strong>High-Pressure Intimidation:</strong> Aggressive
                language or threats of immediate employment termination or
                legal action if you do not comply.
            </li>
        </ul>
    </section>

    <section id="vishing-curated-resources">
        <h2>Curated Resources & References</h2>

        <ul>
            <li>
                <strong>Video Source:</strong>
                <a href="https://www.youtube.com/watch?v=zE60tK9M1x8" target="_blank" rel="noopener noreferrer">
                    Global Cyber Alliance — "What is Vishing? Understanding This High-Tech Phone Scam"
                </a>
            </li>

            <li>
                <strong>Reference Guide:</strong>
                <a href="https://www.cisco.com/site/us/en/learn/topics/security/what-is-vishing.html" target="_blank" rel="noopener noreferrer">
                    Cisco Security Topics — What is Vishing?
                </a>
            </li>
        </ul>
    </section>

    <!-- =========================
         Module Quiz Section
         ========================= -->

    <section class="module-quiz-section">

        <h2>Test Your Knowledge</h2>

        <p>
            Ready to check what you've learned? Take a randomized
            10-question quiz based on this module.
        </p>

        <router-link to="/quiz/module-4/question" class="take-quiz-button">
            Take a Quiz
        </router-link>

    </section>

        <!-- =========================
         AI Chatbot
         ========================= -->
  </main>
</template>

<script src="./Vishing.js"></script>
