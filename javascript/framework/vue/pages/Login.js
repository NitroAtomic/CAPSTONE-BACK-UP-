// Backend and integration: IamAtomic
import auth from '../services/auth.js'

export default {
  name: 'Login',

  data() {
    return {
      email: '',
      password: '',

      // Premium accounts require an emailed code before a session is issued,
      // so the form switches to a code field rather than navigating away.
      awaitingOtp: false,
      otpCode: '',
      pendingToken: null,
      otpEmail: '',

      message: '',
      messageType: 'error',
      busy: false,
      resending: false
    }
  },

  created() {
    // Already signed in, so there is nothing to do here.
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

      if (this.awaitingOtp) return this.submitOtp()
      return this.submitLogin()
    },

    async submitLogin() {
      const email = this.email.trim()

      if (!email.includes('@')) return this.show('Enter a valid email address.')
      if (!this.password) return this.show('Enter your password.')

      this.busy = true
      try {
        const result = await auth.login({ email, password: this.password })

        if (result.requiresOtp) {
          this.awaitingOtp = true
          this.pendingToken = result.pendingToken
          this.otpEmail = result.email
          this.password = ''
          return
        }

        this.show('Signed in. Taking you to your dashboard...', 'success')
        setTimeout(() => this.$router.push('/dashboard'), 600)
      } catch (err) {
        this.show(err.message)
      } finally {
        this.busy = false
      }
    },

    async submitOtp() {
      const code = this.otpCode.trim()
      if (!/^\d{6}$/.test(code)) return this.show('Enter the 6-digit code from your email.')

      this.busy = true
      try {
        await auth.verifyOtp({ pendingToken: this.pendingToken, code })
        this.show('Verified. Taking you to your dashboard...', 'success')
        setTimeout(() => this.$router.push('/dashboard'), 600)
      } catch (err) {
        this.show(err.message)
      } finally {
        this.busy = false
      }
    },

    async resend() {
      this.resending = true
      try {
        await auth.resendOtp(this.pendingToken)
        this.show('A new code has been sent.', 'success')
      } catch (err) {
        this.show(err.message)
      } finally {
        this.resending = false
      }
    },

    backToLogin() {
      this.awaitingOtp = false
      this.otpCode = ''
      this.pendingToken = null
      this.show('')
    }
  }
}
