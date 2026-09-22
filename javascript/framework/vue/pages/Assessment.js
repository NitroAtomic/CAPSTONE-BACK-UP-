// Backend and integration: IamAtomic
import auth from '../services/auth.js'
import assessmentData from '../data/assessment.json'
import examMode from '../services/examMode.js'

export default {
  name: 'Assessment',

  data() {
    return {
      // 'intro' -> 'question' -> 'result'
      stage: 'intro',
      questions: [],
      currentIndex: 0,
      selected: null,
      selectedMulti: [],
      answers: [],
      result: null,
      saveState: 'idle',
      error: ''
    }
  },

  computed: {
    meta() {
      return assessmentData
    },

    total() {
      return this.questions.length
    },

    current() {
      return this.questions[this.currentIndex] || null
    },

    isMultiAnswer() {
      return Array.isArray(this.current?.correctAnswer)
    },

    isLastQuestion() {
      return this.currentIndex === this.total - 1
    },

    canSubmitAnswer() {
      return this.isMultiAnswer ? this.selectedMulti.length > 0 : this.selected !== null
    },

    progressPercent() {
      if (!this.total) return 0
      return Math.round(((this.currentIndex + 1) / this.total) * 100)
    },

    topicLabel() {
      return (key) => this.meta.topics[key] || key
    }
  },

  created() {
    // The assessment is a Premium feature, so a Free account is sent to the
    // subscription page rather than shown a half working version.
    if (!auth.isSignedIn()) {
      this.$router.replace('/login')
      return
    }
    if (!auth.isPremium()) {
      this.$router.replace('/premium-subscription')
      return
    }
    this.questions = assessmentData.questions
  },

  watch: {
    // CyberWise is hidden while questions are on screen, so nobody can ask it
    // for the answers mid-assessment. It comes back on the results screen,
    // where asking why an answer was wrong is exactly the point.
    stage(value) {
      examMode.assessmentInProgress = value === 'question'
    }
  },

  // Leaving the page mid-assessment must not leave the chat hidden elsewhere.
  beforeUnmount() {
    examMode.assessmentInProgress = false
  },

  methods: {
    start() {
      this.stage = 'question'
      this.currentIndex = 0
      this.answers = []
      this.selected = null
      this.selectedMulti = []
    },

    toggleMulti(value) {
      const at = this.selectedMulti.indexOf(value)
      if (at === -1) this.selectedMulti.push(value)
      else this.selectedMulti.splice(at, 1)
    },

    submitAnswer() {
      if (!this.canSubmitAnswer) return

      const question = this.current
      const given = this.isMultiAnswer ? [...this.selectedMulti].sort() : this.selected

      let correct
      if (this.isMultiAnswer) {
        const expected = [...question.correctAnswer].sort()
        correct = given.length === expected.length && given.every((v, i) => v === expected[i])
      } else {
        correct = given === question.correctAnswer
      }

      this.answers.push({
        id: question.id,
        topic: question.topic,
        questionText: question.questionText,
        given,
        correctAnswer: question.correctAnswer,
        correct,
        explanation: question.explanation
      })

      this.selected = null
      this.selectedMulti = []

      if (this.isLastQuestion) this.finish()
      else this.currentIndex += 1
    },

    finish() {
      const score = this.answers.filter((a) => a.correct).length
      const total = this.answers.length
      const percent = total ? Math.round((score / total) * 100) : 0

      // Per topic tallies, which is what turns a score into something
      // actionable rather than just a number.
      const byTopic = {}
      for (const answer of this.answers) {
        if (!byTopic[answer.topic]) byTopic[answer.topic] = { correct: 0, total: 0 }
        byTopic[answer.topic].total += 1
        if (answer.correct) byTopic[answer.topic].correct += 1
      }

      // A topic counts as weak when fewer than two thirds were right, which
      // is one wrong out of two or two wrong out of three.
      const weakAreas = Object.entries(byTopic)
        .filter(([, tally]) => tally.correct / tally.total < 0.67)
        .map(([topic]) => topic)

      const level = [...assessmentData.levels]
        .reverse()
        .find((l) => percent >= l.minPercent) || assessmentData.levels[0]

      this.result = { score, total, percent, byTopic, weakAreas, level }
      this.stage = 'result'
      this.save()
    },

    async save() {
      if (!this.result) return
      this.saveState = 'saving'
      try {
        await auth.submitAssessment({
          score: this.result.score,
          total: this.result.total,
          level: this.result.level.label,
          level_key: this.result.level.key,
          by_topic: this.result.byTopic,
          weak_areas: this.result.weakAreas
        })
        this.saveState = 'saved'
      } catch (err) {
        // The result is on screen either way; the save failing should not
        // hide it.
        console.warn('[assessment] could not save:', err.message)
        this.saveState = 'failed'
      }
    },

    retake() {
      this.stage = 'intro'
      this.result = null
      this.saveState = 'idle'
      this.answers = []
      this.currentIndex = 0
    },

    formatAnswer(question, value) {
      const values = Array.isArray(value) ? value : [value]
      return values
        .map((v) => {
          const option = question.options?.find((o) => o.value === v)
          return option ? `${v.toUpperCase()}) ${option.text}` : String(v).toUpperCase()
        })
        .join('; ')
    },

    answerFor(id) {
      return this.answers.find((a) => a.id === id)
    },

    questionById(id) {
      return this.questions.find((q) => q.id === id)
    }
  }
}
