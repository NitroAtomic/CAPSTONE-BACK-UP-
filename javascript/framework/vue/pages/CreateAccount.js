// Backend and integration: IamAtomic
import auth from '../services/auth.js'

// The original page advertised five password rules, so they are enforced
// here rather than only being decoration.
const RULES = [
  { test: (p) => p.length >= 8,           label: '8 characters' },
  { test: (p) => /[a-z]/.test(p),         label: '1 lowercase letter' },
  { test: (p) => /[A-Z]/.test(p),         label: '1 uppercase letter' },
  { test: (p) => /[0-9]/.test(p),         label: '1 number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p),  label: '1 special character' }
]

export default {
  name: 'CreateAccount',

  data() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      showPassword: false,

      message: '',
      messageType: 'error',
      busy: false
    }
  },

  computed: {
    // Live feedback as the user types, so the rules are not a surprise
    // only revealed on submit.
    ruleStatus() {
      return RULES.map((rule) => ({
        label: rule.label,
        met: this.password.length > 0 && rule.test(this.password)
      }))
    }
  },

  created() {
    if (auth.isSignedIn()) this.$router.replace('/dashboard')
  },

  methods: {
    show(text, type = 'error') {
      this.message = text
      this.messageType = type
    },

    async submit() {
      if (this.busy) return
      this.show('')

      const firstName = this.firstName.trim()
      const email = this.email.trim()

      if (firstName.length < 2) return this.show('Please enter your first name.')
      if (!email.includes('@')) return this.show('Enter a valid email address.')

      const unmet = RULES.filter((r) => !r.test(this.password)).map((r) => r.label)
      if (unmet.length) return this.show('Your password still needs: ' + unmet.join(', ') + '.')

      if (this.password !== this.confirmPassword) {
        return this.show('The two passwords do not match.')
      }

      this.busy = true
      try {
        await auth.register({
          firstName,
          lastName: this.lastName.trim(),
          email,
          password: this.password
        })

        // Someone who arrived from the premium flow should continue to
        // payment rather than being dropped on the dashboard.
        const next = this.$route.query.next === 'payment' ? '/payment' : '/dashboard'
        this.show('Account created. Taking you there now...', 'success')
        setTimeout(() => this.$router.push(next), 700)
      } catch (err) {
        this.show(err.message)
      } finally {
        this.busy = false
      }
    }
  }
}
