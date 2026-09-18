// Backend and integration: IamAtomic
import auth from '../services/auth.js'
import { getSelectedPlan, clearSelectedPlan } from './PremiumSubscription.js'

// The widely used test number. Passes the Luhn check, belongs to no real account.
const DEMO_CARD = '4242424242424242'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

// Real card numbers satisfy the Luhn checksum. Used here to detect and
// refuse a genuine card, never to accept one.
function passesLuhn(number) {
  let sum = 0
  let alternate = false
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number.charAt(i), 10)
    if (alternate) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    alternate = !alternate
  }
  return number.length > 0 && sum % 10 === 0
}

export default {
  name: 'Payment',

  data() {
    return {
      plan: getSelectedPlan(),
      cardholder: '',
      cardNumber: '',
      expiry: '',
      cvv: '',

      alreadyPremium: false,
      message: '',
      messageType: 'error',
      busy: false,
      done: false
    }
  },

  created() {
    if (!auth.isSignedIn()) {
      this.$router.replace('/login')
      return
    }
    if (auth.isPremium()) {
      this.alreadyPremium = true
      this.show('This account is already on the Premium plan.', 'info')
    }
  },

  methods: {
    show(text, type = 'error') {
      this.message = text
      this.messageType = type
    },

    formatCard() {
      const digits = digitsOnly(this.cardNumber).slice(0, 16)
      this.cardNumber = digits.replace(/(.{4})/g, '$1 ').trim()
    },

    formatExpiry() {
      const digits = digitsOnly(this.expiry).slice(0, 4)
      this.expiry = digits.length > 2 ? digits.slice(0, 2) + ' / ' + digits.slice(2) : digits
    },

    validExpiry() {
      const match = this.expiry.match(/^(\d{2})\s*\/?\s*(\d{2})$/)
      if (!match) return false

      const month = parseInt(match[1], 10)
      const year = 2000 + parseInt(match[2], 10)
      if (month < 1 || month > 12) return false

      return new Date(year, month, 0, 23, 59, 59) >= new Date()
    },

    async submit() {
      if (this.busy || this.alreadyPremium) return
      this.show('')

      const card = digitsOnly(this.cardNumber)

      if (this.cardholder.trim().length < 2) return this.show('Enter the name on the card.')

      if (card !== DEMO_CARD) {
        // Refuse anything that could plausibly be a genuine card. Labelling
        // the page as a demo is not enough on its own: during testing someone
        // could type a real card out of habit.
        if (card.length >= 13 && passesLuhn(card)) {
          this.cardNumber = ''
          return this.show(
            'That looks like a real card number, so it was rejected and nothing was sent. ' +
            'This is a simulation: please use the demo card 4242 4242 4242 4242.'
          )
        }
        return this.show('Use the demo card number 4242 4242 4242 4242 for this simulation.')
      }

      if (!this.validExpiry()) return this.show('Enter a valid future expiry date, for example 12 / 30.')
      if (digitsOnly(this.cvv).length < 3) return this.show('Enter a 3-digit CVV. Any three digits are fine for the demo.')

      this.busy = true
      this.show('Simulating payment, no card data is being sent...', 'info')

      try {
        await auth.changePlan('Premium')
        clearSelectedPlan()
        this.done = true
        this.show('Simulated payment complete. Premium features are now unlocked.', 'success')
        setTimeout(() => this.$router.push('/dashboard'), 1200)
      } catch (err) {
        this.show(err.message)
      } finally {
        this.busy = false
      }
    }
  }
}
