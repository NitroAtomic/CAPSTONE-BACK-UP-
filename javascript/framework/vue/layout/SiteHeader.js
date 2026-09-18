import auth from '../services/auth.js'

export default {
  name: 'SiteHeader',

  data() {
    return {
      searchQuery: '',
      // Re-read on every route change so the nav reflects signing in or out
      // without needing a full page reload.
      user: auth.getUser(),
      modules: [
        { id: 1, title: 'Quishing', link: '/modules/quishing' },
        { id: 2, title: 'Spear Phishing', link: '/modules/spear-phishing' },
        { id: 3, title: 'Smishing', link: '/modules/smishing' },
        { id: 4, title: 'Vishing', link: '/modules/vishing' },
        { id: 5, title: 'Pretexting', link: '/modules/pretexting' },
        {
          id: 6,
          title: 'Essential Safe Practices for Remote Environments',
          link: '/modules/essential-safe-practices-remote-environments'
        }
      ]
    }
  },

  watch: {
    // vue-router keeps this component mounted across navigations, so the
    // auth state has to be refreshed explicitly when the route changes.
    $route() {
      this.user = auth.getUser()
    }
  },

  computed: {
    // These derive from this.user rather than calling auth directly, because
    // auth reads sessionStorage, which Vue cannot track. A computed with no
    // reactive dependency caches its first result forever, which is why the
    // nav kept offering "Go Premium" to an account that had just upgraded.
    isPremium() {
      return this.user?.subscription_type === 'Premium' &&
             this.user?.subscription_status === 'active'
    },

    isAdmin() {
      return this.user?.role === 'admin'
    },

    searchResults() {
      const query = this.searchQuery.trim().toLowerCase()
      if (!query) return []
      return this.modules.filter((module) =>
        module.title.toLowerCase().includes(query)
      )
    }
  },

  methods: {
    async signOut() {
      await auth.logout()
      this.user = null
      this.$router.push('/')
    },


    clearSearch() {
      this.searchQuery = ''
    },

    goToFirstResult() {
      if (this.searchResults.length === 0) return
      this.$router.push(this.searchResults[0].link)
      this.clearSearch()
    }
  }
}
