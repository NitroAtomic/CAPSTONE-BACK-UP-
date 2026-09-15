<template>
  <main>
    <section id="home" class="home-section">

      <div class="home-heading">
        <h1>Social Engineering Awareness Platform</h1>
        <p>Hello! Where do you need help in?</p>
      </div>

      <section id="modules" class="modules-section">

        <div class="section-heading">
          <h2>Free modules</h2>
          <p>Foundations of social engineering for remote workers</p>
        </div>

        <div class="modules-grid">

          <router-link to="/modules/quishing" class="module-card">
            <div>
              <h3>Quishing</h3>
              <p>Email Phishing, Fake Login Pages & QR Code Exploits</p>
            </div>
            <img class="module-icon" src="/images/icons/module-quishing.png" alt="">
          </router-link>

          <router-link to="/modules/spear-phishing" class="module-card">
            <div>
              <h3>Spear Phishing</h3>
              <p>Targeted Digital Surveillance</p>
            </div>
            <img class="module-icon" src="/images/icons/module-spear-phishing.png" alt="">
          </router-link>

          <router-link to="/modules/smishing" class="module-card">
            <div>
              <h3>Smishing</h3>
              <p>SMS & Mobile Messaging Attacks</p>
            </div>
            <img class="module-icon" src="/images/icons/module-smishing.png" alt="">
          </router-link>

          <router-link to="/modules/vishing" class="module-card">
            <div>
              <h3>Vishing</h3>
              <p>Voice Phishing & Social Engineering Calls</p>
            </div>
            <img class="module-icon" src="/images/icons/module-vishing.png" alt="">
          </router-link>

          <router-link to="/modules/pretexting" class="module-card">
            <div>
              <h3>Pretexting</h3>
              <p>Trust-Building Manipulation</p>
            </div>
            <img class="module-icon" src="/images/icons/module-pretexting.png" alt="">
          </router-link>

          <router-link to="/modules/essential-safe-practices-remote-environments" class="module-card">
            <div>
              <h3>Essential Safe Practices for Remote Environments</h3>
              <p>Universal application across all remote and hybrid employment setups</p>
            </div>
            <img class="module-icon" src="/images/icons/cyber-security.png" alt="">
          </router-link>

        </div>
      </section>

      <section id="premium-modules" class="premium-section">

        <div class="section-heading premium-heading">
          <h2>
            Premium
            <span class="premium-badge">Pro</span>
          </h2>

          <p>
            Role-based modules, personalized assessment and dashboard
          </p>
        </div>

        <div class="premium-grid">

          <article class="premium-card">
            <div>
              <h3>Role-based<br>modules</h3>
              <p>Freelancer and client scam scenarios</p>
            </div>
            <img class="lock-icon" src="/images/icons/padlock.png" alt="">
          </article>

          <article class="premium-card">
            <div>
              <h3>Personalized<br>dashboard</h3>
              <p>Tracking progress, quiz history, weak areas</p>
            </div>
            <img class="lock-icon" src="/images/icons/padlock.png" alt="">
          </article>

          <article class="premium-card">
            <div>
              <h3>Awareness<br>assessment</h3>
              <p>Find your current cybersecurity awareness level</p>
            </div>
            <img class="lock-icon" src="/images/icons/padlock.png" alt="">
          </article>

        </div>

        <div class="premium-action">
          <router-link to="/premium-subscription" class="btn btn-upgrade">
            Upgrade to premium
          </router-link>
        </div>

      </section>

    </section>
  </main>
</template>

<script src="./Home.js"></script>
<!-- Styles now load once, globally, via css/framework/tailwind/main.css (see main.js).
     Do not re-add a per-component <style src> here — see the note at the top
     of main.css for why that breaks the @layer components build. -->