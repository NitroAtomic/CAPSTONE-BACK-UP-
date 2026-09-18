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

          <!-- Locked for guests and Free accounts, a real link once the
               subscription is active. -->
          <component
            v-for="card in premiumCards"
            :key="card.title"
            :is="isPremium ? 'router-link' : 'article'"
            :to="isPremium ? card.to : undefined"
            class="premium-card"
            :class="{ 'premium-card-open': isPremium }"
          >
            <div>
              <h3>{{ card.title }}<br>{{ card.subtitle }}</h3>
              <p>{{ card.blurb }}</p>
            </div>
            <img v-if="!isPremium" class="lock-icon" src="/images/icons/padlock.png" alt="Locked">
          </component>

        </div>

        <div class="premium-action">
          <router-link v-if="!isPremium" to="/premium-subscription" class="btn btn-upgrade">
            Upgrade to premium
          </router-link>

          <template v-else>
            <router-link to="/dashboard" class="btn btn-upgrade">
              Go to your dashboard
            </router-link>
            <p class="premium-active-note">
              You're on the Premium plan, so everything above is unlocked.
            </p>
          </template>
        </div>

      </section>

    </section>
  </main>
</template>

<script src="./Home.js"></script>
<!-- Styles now load once, globally, via css/framework/tailwind/main.css (see main.js).
     Do not re-add a per-component <style src> here — see the note at the top
     of main.css for why that breaks the @layer components build. -->