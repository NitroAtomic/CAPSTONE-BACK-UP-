// Backend and integration: IamAtomic
import auth from '../services/auth.js'
import premiumData from '../data/premium-modules.json'

export default {
  name: 'PremiumModule',

  data() {
    return {
      module: null,
      notFound: false
    }
  },

  computed: {
    slug() {
      return this.$route.params.slug
    },

    // Where "next module" should point, so the set reads as a sequence
    // rather than four unrelated pages.
    nextModule() {
      const all = premiumData.modules
      const at = all.findIndex((m) => m.slug === this.slug)
      if (at === -1 || at === all.length - 1) return null
      return all[at + 1]
    }
  },

  created() {
    this.guardAndLoad()
  },

  watch: {
    slug() {
      this.guardAndLoad()
    }
  },

  methods: {
    guardAndLoad() {
      if (!auth.isSignedIn()) {
        this.$router.replace('/login')
        return
      }

      // The gate matters here: this is the content people are paying for.
      // The API enforces the same rule, so a Free account calling it
      // directly is refused too.
      if (!auth.isPremium()) {
        this.$router.replace('/premium-subscription')
        return
      }

      const found = premiumData.modules.find((m) => m.slug === this.slug)
      this.module = found || null
      this.notFound = !found
    }
  }
}
