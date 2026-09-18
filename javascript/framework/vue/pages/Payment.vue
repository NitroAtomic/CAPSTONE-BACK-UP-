<template>
  <main class="checkout-page">
    <section class="checkout-card">

      <div class="checkout-heading">
        <h1>Go premium</h1>
      </div>

      <!-- Deliberately prominent. A convincing checkout on a platform that
           teaches people to spot fake payment pages needs to announce itself. -->
      <div class="checkout-demo-banner" role="status">
        <strong>Simulation only: no payment is processed</strong>
        <p>
          This is a prototype checkout. Nothing is charged, no card details are sent
          anywhere, and nothing is stored. <strong>Do not enter a real card number.</strong>
          Use the demo card <code>4242 4242 4242 4242</code> with any future expiry
          and any 3-digit CVV.
        </p>
      </div>

      <div class="checkout-plan-summary">
        <span>Premium plan &middot; {{ plan.label }}</span>
        <span><strong>{{ plan.amount }}</strong> <small>{{ plan.period }}</small></span>
      </div>

      <p v-if="message" class="auth-message" :class="'auth-message-' + messageType">
        {{ message }}
      </p>

      <form class="auth-form" @submit.prevent="submit">

        <div class="auth-field">
          <label for="cardholder">Name on card</label>
          <input id="cardholder" v-model="cardholder" type="text"
                 autocomplete="cc-name" placeholder="Juan Dela Cruz"
                 :disabled="alreadyPremium || done">
        </div>

        <div class="auth-field">
          <label for="card-number">Card number</label>
          <input id="card-number" v-model="cardNumber" type="text"
                 inputmode="numeric" placeholder="4242 4242 4242 4242"
                 :disabled="alreadyPremium || done" @input="formatCard">
        </div>

        <div class="auth-field-row">
          <div class="auth-field">
            <label for="expiry">Expiry</label>
            <input id="expiry" v-model="expiry" type="text"
                   inputmode="numeric" placeholder="MM / YY"
                   :disabled="alreadyPremium || done" @input="formatExpiry">
          </div>

          <div class="auth-field">
            <label for="cvv">CVV</label>
            <input id="cvv" v-model="cvv" type="text"
                   inputmode="numeric" maxlength="4" placeholder="123"
                   :disabled="alreadyPremium || done">
          </div>
        </div>

        <button class="auth-submit" type="submit" :disabled="busy || alreadyPremium || done">
          <template v-if="alreadyPremium">Already subscribed</template>
          <template v-else-if="done">Subscribed</template>
          <template v-else-if="busy">Processing simulation...</template>
          <template v-else>Subscribe</template>
        </button>

      </form>

    </section>
  </main>
</template>

<script>
import Payment from './Payment.js'
export default Payment
</script>
