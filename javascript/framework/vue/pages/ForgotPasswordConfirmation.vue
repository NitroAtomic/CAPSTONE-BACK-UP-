<template>
  <main class="auth-page">
    <section class="auth-card">

      <div class="auth-heading">
        <h1>Password updated</h1>
        <p>You can now log in with your new password.</p>
      </div>

      <p class="auth-footnote">
        <router-link to="/login">Go to log in</router-link>
      </p>

    </section>
  </main>
</template>

<script>
export default { name: 'ForgotPasswordConfirmation' }
</script>
