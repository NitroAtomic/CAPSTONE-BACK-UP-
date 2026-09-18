// Backend and integration: IamAtomic
import auth from '../services/auth.js'
import premiumData from '../data/premium-modules.json'

export default {
  name: 'PremiumModules',

  data() {
    return {
      modules: premiumData.modules,
      isPremium: false
    }
  },

  created() {
    if (!auth.isSignedIn()) {
      this.$router.replace('/login')
      return
    }
    // A Free account can see this list, so the value of upgrading is clear,
    // but the module pages themselves are gated.
    this.isPremium = auth.isPremium()
  }
}
