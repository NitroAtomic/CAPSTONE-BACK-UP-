<template>
  <main class="auth-page">
    <section class="auth-card">

      <div class="auth-heading">
        <h1>Forgot password</h1>
        <p v-if="step === 'request'">
          Enter your email and we'll send you a code to reset it
        </p>
        <p v-else>
          If an account exists for <strong>{{ email }}</strong>, a 6-digit reset code
          is on its way. Enter it below along with your new password.
        </p>
      </div>

      <p v-if="message" class="auth-message" :class="'auth-message-' + messageType">
        {{ message }}
      </p>

      <form class="auth-form" @submit.prevent="submit">

        <template v-if="step === 'request'">
          <div class="auth-field">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email"
                   autocomplete="email" placeholder="name@email.com">
          </div>
        </template>

        <template v-else>
          <div class="auth-field">
            <label for="reset-code">Reset code</label>
            <input id="reset-code" v-model="code" type="text" inputmode="numeric"
                   maxlength="6" autocomplete="one-time-code" placeholder="000000"
                   class="auth-code-input">
          </div>

          <div class="auth-field">
            <label for="new-password">New password</label>
            <input id="new-password" v-model="newPassword" type="password"
                   autocomplete="new-password" placeholder="Create a new password">
          </div>

          <div class="auth-field">
            <label for="confirm-new-password">Confirm new password</label>
            <input id="confirm-new-password" v-model="confirmPassword" type="password"
                   autocomplete="new-password" placeholder="Re-enter your new password">
          </div>
        </template>

        <button class="auth-submit" type="submit" :disabled="busy">
          {{ busy ? 'Please wait...' : (step === 'request' ? 'Send reset code' : 'Reset password') }}
        </button>

      </form>

      <p class="auth-footnote">
        <router-link to="/login">Back to log in</router-link>
      </p>

    </section>
  </main>
</template>

<script>
import ForgotPassword from './ForgotPassword.js'
export default ForgotPassword
</script>
