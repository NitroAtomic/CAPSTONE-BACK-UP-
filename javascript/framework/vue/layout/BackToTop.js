// Backend and integration: IamAtomic
export default {
  name: 'BackToTop',

  data() {
    return { show: false }
  },

  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true })
    this.onScroll()
  },

  // Inaalis yung listener paglabas ng page; kung hindi, dumadami sila tuwing
  // magpapalit ng page at patuloy pa ring tumatakbo.
  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll)
  },

  methods: {
    onScroll() {
      this.show = window.scrollY > 600
    },

    toTop() {
      // Sinusunod yung setting ng user: kung naka-reduce motion sya, diretso
      // na lang, walang mahabang animation.
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    }
  }
}
