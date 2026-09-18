// Backend and integration: IamAtomic
import auth from '../services/auth.js'

export default {
  name: 'Home',

  data() {
    return {
      // Read once here and refreshed on navigation, because auth reads
      // sessionStorage, which Vue cannot track. A computed calling it
      // directly would cache its first result and never update, which is
      // how the page ended up telling subscribers to upgrade.
      user: auth.getUser(),

      premiumCards: [
        { title: 'Role-based', subtitle: 'modules',
          blurb: 'Freelancer and client scam scenarios', to: '/premium-modules' },
        { title: 'Personalized', subtitle: 'dashboard',
          blurb: 'Tracking progress, quiz history, weak areas', to: '/dashboard' },
        { title: 'Awareness', subtitle: 'assessment',
          blurb: 'Find your current cybersecurity awareness level', to: '/assessment' }
      ]
    }
  },

  computed: {
    isPremium() {
      return this.user?.subscription_type === 'Premium' &&
             this.user?.subscription_status === 'active'
    }
  },

  watch: {
    $route() {
      this.user = auth.getUser()
    }
  }
}
