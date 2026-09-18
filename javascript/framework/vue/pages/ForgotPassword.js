// Backend and integration: IamAtomic
import auth from '../services/auth.js'

const RULES = [
  { test: (p) => p.length >= 8,          label: '8 characters' },
  { test: (p) => /[a-z]/.test(p),        label: '1 lowercase letter' },
  { test: (p) => /[A-Z]/.test(p),        label: '1 uppercase letter' },
  { test: (p) => /[0-9]/.test(p),        label: '1 number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: '1 special character' }
]

export default {
  name: 'ForgotPassword',

  data() {
    return {
      // Step one asks for the email; step two takes the emailed code plus
      // the new password.
      step: 'request',
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: '',

      message: '',
      messageType: 'error',
      busy: false
    }
  },

  methods: {
    show(text, type = 'error') {
      this.message = text
      this.messageType = type
    },

    async submit() {
      if (this.busy) return
      this.show('')
      return this.step === 'request' ? this.requestCode() : this.resetPassword()
    },

    async requestCode() {
      const email = this.email.trim()
      if (!email.includes('@')) return this.show('Enter a valid email address.')

      this.busy = true
      try {
        await auth.forgotPassword(email)
        // The response is deliberately the same whether or not the account
        // exists, so this screen cannot be used to discover which emails
        // are registered.
        this.email = email
        this.step = 'reset'
      } catch (err) {
        this.show(err.message)
      } finally {
        this.busy = false
      }
    },

    async resetPassword() {
      const code = this.code.trim()
      if (!/^\d{6}$/.test(code)) return this.show('Enter the 6-digit code from your email.')

      const unmet = RULES.filter((r) => !r.test(this.newPassword)).map((r) => r.label)
      if (unmet.length) return this.show('Your new password still needs: ' + unmet.join(', ') + '.')

      if (this.newPassword !== this.confirmPassword) {
        return this.show('The two passwords do not match.')
      }

      this.busy = true
      try {
        await auth.resetPassword({ email: this.email, code, newPassword: this.newPassword })
        this.show('Password updated. Taking you to the login page...', 'success')
        setTimeout(() => this.$router.push('/login'), 1200)
      } catch (err) {
        this.show(err.message)
      } finally {
        this.busy = false
      }
    }
  }
}
