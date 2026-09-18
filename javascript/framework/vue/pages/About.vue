<template>
  <main class="about-page">

    <header class="about-heading">
      <h1>About this platform</h1>
      <p>
        A learning platform that teaches remote workers, freelancers, and
        virtual assistants to recognise and respond to social engineering.
      </p>
    </header>

    <section class="about-section">
      <h2>Why remote workers</h2>
      <p>
        Most security awareness training is written for people in an office,
        behind a corporate firewall, with an IT desk down the hall. Remote
        workers have none of that. They use their own devices and networks,
        deal with clients they have never met in person, and decide alone
        whether a request is genuine.
      </p>
      <p>
        That makes them a practical target. The attacks covered here are the
        ones that actually reach them: a client whose account has been taken
        over, an invoice with altered bank details, a recruiter who wants a
        passport scan before a contract exists.
      </p>
    </section>

    <section class="about-section">
      <h2>How it is organised</h2>
      <p>
        Six free modules cover the core attack types, each with a quiz drawn
        from a larger question bank so a retake is not the same test twice.
        They need no account and store nothing about you.
      </p>
      <p>
        The Premium tier adds an awareness assessment that identifies which
        topics to focus on, a dashboard tracking progress and quiz history,
        and role-based modules built around scenarios specific to freelance
        and contract work.
      </p>
    </section>

    <section class="about-section">
      <h2>Privacy</h2>
      <p>
        Browsing the free modules and taking their quizzes requires no
        account and stores nothing on the server. Quiz results pass between
        pages using storage belonging to that single browser tab, and are
        discarded when it closes.
      </p>
      <p>
        A Premium account stores the minimum needed to work: name, email, a
        hashed password, subscription state, and learning progress. No plain
        text password is written anywhere. There is no analytics or tracking
        on any tier, and chatbot messages are not kept.
      </p>
    </section>

    <section class="about-section">
      <h2>The project</h2>
      <p>
        Built as a capstone project by Group 4 for MO-IT200D1, Web-Based
        Social Engineering Awareness Platform for Remote Workers.
      </p>
      <p>
        The frontend is Vue with Tailwind. The backend is Node.js and Express
        over MySQL, with bcrypt password hashing and JWT sessions. Access
        control is enforced on the server rather than hidden in the interface,
        so a Free account requesting Premium content directly is still
        refused.
      </p>
      <p class="about-note">
        Payment processing is simulated. The scope of this study covers
        subscription state only, not billing or financial transactions, so no
        card details are ever transmitted or stored.
      </p>
    </section>

  </main>
</template>

<script>
export default { name: 'About' }
</script>
