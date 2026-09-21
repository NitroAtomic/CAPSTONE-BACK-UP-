// Backend and integration: IamAtomic
import auth from '../services/auth.js'
import premiumData from '../data/premium-modules.json'

export default {
  name: 'PremiumModule',

  data() {
    return {
      module: null,
      notFound: false,
      loading: true,
      nextModule: null
    }
  },

  computed: {
    slug() {
      return this.$route.params.slug
    },

    // Normalizes a YouTube watch/share link into its embeddable form so an
    // admin can paste the URL they'd naturally copy from the browser bar.
    // Anything else (a direct .mp4, Vimeo, etc.) is passed through as-is.
    videoEmbedUrl() {
      const url = this.module?.video_url
      if (!url) return null
      const watch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
      return watch ? `https://www.youtube.com/embed/${watch[1]}` : url
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
    async guardAndLoad() {
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

      this.loading = true
      this.notFound = false

      const authoredList = premiumData.modules
      const authored = authoredList.find((m) => m.slug === this.slug)

      try {
        const row = await auth.getModule(this.slug)
        this.module = {
          slug: row.slug,
          title: row.module_title,
          summary: authored?.summary || row.description || '',
          audience: authored?.audience || '',
          // The four modules written for the study carry a multi-section
          // body; a module an admin created through the panel only has a
          // plain description, so it renders as a single section instead.
          sections: authored?.sections || (row.description
            ? [{ heading: 'Overview', body: row.description }]
            : []),
          video_url: row.video_url || null
        }

        // "Next module" only makes sense as a walk through the hand-authored
        // sequence; an admin-added module just ends the chain.
        const at = authoredList.findIndex((m) => m.slug === this.slug)
        this.nextModule = (at !== -1 && at < authoredList.length - 1) ? authoredList[at + 1] : null
      } catch (err) {
        this.notFound = true
      } finally {
        this.loading = false
      }
    }
  }
}
