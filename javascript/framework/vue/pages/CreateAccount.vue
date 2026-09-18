<template>
  <main class="auth-page">
    <section class="auth-card auth-card-wide">

      <div class="auth-heading">
        <h1>Create your account</h1>
        <p>This is the account you'll use to log in and access premium features</p>
      </div>

      <p v-if="message" class="auth-message" :class="'auth-message-' + messageType">
        {{ message }}
      </p>

      <form class="auth-form" @submit.prevent="submit">

        <div class="auth-field-row">
          <div class="auth-field">
            <label for="first-name">First name</label>
            <input id="first-name" v-model="firstName" type="text"
                   autocomplete="given-name" placeholder="Juan">
          </div>

          <div class="auth-field">
            <label for="last-name">Last name</label>
            <input id="last-name" v-model="lastName" type="text"
                   autocomplete="family-name" placeholder="Dela Cruz">
          </div>
        </div>

        <div class="auth-field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email"
                 autocomplete="email" placeholder="name@email.com">
        </div>

        <div class="auth-field">
          <label for="password">Password</label>
          <div class="auth-password-wrap">
            <input id="password" v-model="password"
                   :type="showPassword ? 'text' : 'password'"
                   autocomplete="new-password" placeholder="Create a password">
            <button type="button" class="auth-password-toggle"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>

          <ul class="auth-rules">
            <li v-for="rule in ruleStatus" :key="rule.label"
                :class="{ 'auth-rule-met': rule.met }">
              {{ rule.label }}
            </li>
          </ul>
        </div>

        <div class="auth-field">
          <label for="confirm-password">Confirm password</label>
          <input id="confirm-password" v-model="confirmPassword" type="password"
                 autocomplete="new-password" placeholder="Re-enter your password">
        </div>

        <button class="auth-submit" type="submit" :disabled="busy">
          {{ busy ? 'Creating account...' : 'Create account' }}
        </button>

      </form>

      <p class="auth-footnote">
        Already have an account?
        <router-link to="/login">Log in instead</router-link>
      </p>

    </section>
  </main>
</template>

<script>
import CreateAccount from './CreateAccount.js'
export default CreateAccount
</script>
