export default {
  name: 'SiteHeader',

  data() {
    return {
      searchQuery: '',
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

  computed: {
    searchResults() {
      const query = this.searchQuery.trim().toLowerCase()
      if (!query) return []
      return this.modules.filter((module) =>
        module.title.toLowerCase().includes(query)
      )
    }
  },

  methods: {
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
