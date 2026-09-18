<template>
  <main class="subscribe-page">
    <section class="subscribe-card">

      <div class="subscribe-heading">
        <h1>Go premium</h1>
        <p>Unlock role-based modules and your personal dashboard</p>
      </div>

      <div class="subscribe-billing-toggle">
        <button type="button"
                :class="{ 'is-active': selected === 'monthly' }"
                @click="choose('monthly')">
          Monthly
        </button>
        <button type="button"
                :class="{ 'is-active': selected === 'yearly' }"
                @click="choose('yearly')">
          Yearly <small>Save</small>
        </button>
      </div>

      <div class="subscribe-plan">
        <div class="subscribe-plan-header">
          <div>
            <h2>Premium plan</h2>
            <p>{{ plan.billing }}</p>
          </div>
          <div class="subscribe-plan-price">
            <strong>{{ plan.amount }}</strong>
            <span>{{ plan.period }}</span>
          </div>
        </div>

        <ul class="subscribe-features">
          <li>Role-based social engineering modules</li>
          <li>Personalized learning dashboard</li>
          <li>Progress and quiz history tracking</li>
          <li>Cybersecurity awareness assessment</li>
          <li>Recommended modules based on your weak areas</li>
        </ul>

        <router-link class="subscribe-continue" :to="continueTo">
          {{ continueLabel }}
        </router-link>
      </div>

      <p class="subscribe-account-note">{{ accountNote }}</p>

      <p v-if="!isSignedIn" class="auth-footnote">
        Already have an account?
        <router-link to="/login">Log in</router-link>
      </p>

    </section>
  </main>
</template>

<script>
import PremiumSubscription from './PremiumSubscription.js'
export default PremiumSubscription
</script>
