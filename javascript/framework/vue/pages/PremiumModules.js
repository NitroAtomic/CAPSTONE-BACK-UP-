// Backend and integration: IamAtomic
import auth from '../services/auth.js'
import premiumData from '../data/premium-modules.json'

export default {
  name: 'PremiumModules',

  data() {
    return {
      modules: [],
      isPremium: false,
      loading: true,
      error: ''
    }
  },

  async created() {
    if (!auth.isSignedIn()) {
      this.$router.replace('/login')
      return
    }
    // A Free account can see this list, so the value of upgrading is clear,
    // but the module pages themselves are gated.
    this.isPremium = auth.isPremium()

    try {
      const rows = await auth.getPremiumModulesList()
      // The modules written for the study ship with richer copy (a summary
      // line) than a bare database row carries; merge that in by slug, and
      // fall back to the admin-entered description for anything added since.
      const authored = Object.fromEntries(premiumData.modules.map((m) => [m.slug, m]))
      this.modules = rows.map((row) => ({
        slug: row.slug,
        title: row.module_title,
        summary: authored[row.slug]?.summary || row.description || ''
      }))
    } catch (err) {
      this.error = err.message
    } finally {
      this.loading = false
    }
  }
}
