<template>
  <main class="auth-page">
    <section class="auth-card">

      <div class="auth-heading">
        <h1>{{ awaitingOtp ? 'Check your email' : 'Welcome back!' }}</h1>
        <p v-if="!awaitingOtp">Log in to continue your learning journey.</p>
        <p v-else>
          This account uses two-step verification. We sent a 6-digit code to
          <strong>{{ otpEmail }}</strong>.
        </p>
      </div>

      <p v-if="message" class="auth-message" :class="'auth-message-' + messageType">
        {{ message }}
      </p>

      <form class="auth-form" @submit.prevent="submit">

        <template v-if="!awaitingOtp">
          <div class="auth-field">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email" autocomplete="email"
                   placeholder="Enter your email">
          </div>

          <div class="auth-field">
            <label for="password">Password</label>
            <input id="password" v-model="password" type="password"
                   autocomplete="current-password" placeholder="Enter your password">
          </div>

          <router-link class="auth-link-right" to="/forgot-password">Forgot password?</router-link>
        </template>

        <template v-else>
          <div class="auth-field">
            <label for="otp">Verification code</label>
            <input id="otp" v-model="otpCode" type="text" inputmode="numeric"
                   maxlength="6" autocomplete="one-time-code" placeholder="000000"
                   class="auth-code-input">
          </div>
        </template>

        <button class="auth-submit" type="submit" :disabled="busy">
          {{ busy ? 'Please wait...' : (awaitingOtp ? 'Verify and continue' : 'Log in') }}
        </button>

      </form>

      <p v-if="awaitingOtp" class="auth-footnote">
        <button type="button" class="auth-text-button" :disabled="resending" @click="resend">
          {{ resending ? 'Sending...' : 'Resend code' }}
        </button>
        <span aria-hidden="true"> · </span>
        <button type="button" class="auth-text-button" @click="backToLogin">Back to login</button>
      </p>

      <p v-else class="auth-footnote">
        Don't have an account?
        <router-link to="/create-account">Create an account</router-link>
      </p>

    </section>
  </main>
</template>

<script>
import Login from './Login.js'
export default Login
</script>
