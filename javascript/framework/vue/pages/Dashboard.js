// Backend and integration: IamAtomic
import auth from '../services/auth.js'
import assessmentData from '../data/assessment.json'

export default {
  name: 'Dashboard',

  data() {
    return {
      user: null,
      progress: [],
      quizHistory: [],
      assessment: null,
      recommendations: [],
      loading: true,
      error: ''
    }
  },

  computed: {
    firstName() {
      return this.user?.first_name || 'there'
    },

    completedCount() {
      return this.progress.filter((p) => p.completion_status === 'completed').length
    },

    averageScore() {
      if (!this.quizHistory.length) return '--'
      const total = this.quizHistory.reduce(
        (sum, h) => sum + (h.total ? (h.score / h.total) * 100 : 0),
        0
      )
      return Math.round(total / this.quizHistory.length) + '%'
    },

    weakAreas() {
      const raw = this.assessment?.weak_areas || []
      // Stored as slugs, shown as the topic names people actually read.
      return raw.map((slug) => ({
        slug,
        label: assessmentData.topics[slug] || slug
      }))
    },

    // Per topic scores from the latest assessment, used for the breakdown bars.
    topicScores() {
      const byTopic = this.assessment?.by_topic || {}
      return Object.entries(byTopic).map(([slug, tally]) => ({
        slug,
        label: assessmentData.topics[slug] || slug,
        correct: tally.correct,
        total: tally.total,
        percent: tally.total ? Math.round((tally.correct / tally.total) * 100) : 0
      }))
    },

    // Quiz history oldest first, so the trend reads left to right.
    quizTrend() {
      return [...this.quizHistory]
        .reverse()
        .map((h) => ({
          label: h.module_title,
          percent: h.total ? Math.round((h.score / h.total) * 100) : 0
        }))
    },

    assessmentPercent() {
      if (!this.assessment?.total) return 0
      return Math.round((this.assessment.score / this.assessment.total) * 100)
    },

    isPremium() {
      return auth.isPremium()
    }
  },

  async created() {
    // Access control: this page is meaningless without an account, and the
    // redirect happens before any content renders.
    if (!auth.isSignedIn()) {
      this.$router.replace('/login')
      return
    }

    try {
      this.user = await auth.refreshUser()

      const [dashboard, recommendations] = await Promise.all([
        auth.getDashboard(),
        auth.getRecommendations().catch(() => [])
      ])

      this.progress = dashboard.progress || []
      this.quizHistory = dashboard.quiz_history || []
      this.assessment = dashboard.assessment || null
      this.recommendations = recommendations || []
    } catch (err) {
      this.error = err.message
    } finally {
      this.loading = false
    }
  },

  methods: {
    percent(entry) {
      return entry.total ? Math.round((entry.score / entry.total) * 100) + '%' : '--'
    },

    // Same 70% pass mark as QuizQuestion.js / QuizResults.vue, so the badge
    // shown here always agrees with what the user saw right after the quiz.
    passed(entry) {
      return entry.total ? entry.score / entry.total >= 0.7 : false
    },

    formatDate(value) {
      if (!value) return ''
      const date = new Date(value)
      return isNaN(date) ? '' : date.toLocaleDateString()
    }
  }
}
