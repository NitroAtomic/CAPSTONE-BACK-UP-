// Static import of all 5 built modules' question data.
// Vite bundles .json imports automatically — no extra config needed.
import module1 from '../data/module-1.json'
import module2 from '../data/module-2.json'
import module3 from '../data/module-3.json'
import module4 from '../data/module-4.json'
import module5 from '../data/module-5.json'

const MODULE_DATA = {
  'module-1': module1,
  'module-2': module2,
  'module-3': module3,
  'module-4': module4,
  'module-5': module5
}

// Fisher-Yates shuffle — randomizes ORDER only.
// We never drop or add questions here; all 10 always appear,
// just in a different sequence each attempt (per Capstone paper requirement).
function shuffleOrder(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default {
  name: 'QuizQuestion',

  data() {
    return {
      moduleData: null,        // the loaded module-N.json (name, totals, etc.)
      shuffledQuestions: [],   // the 10 questions, order randomized for this attempt
      currentIndex: 0,         // which question (0-9) is currently shown
      answers: {}              // { [questionId]: 'b' }  or  { [questionId]: ['a','b'] }
    }
  },

  computed: {
    // Reads the moduleId straight from the URL (e.g. /quiz/module-1)
    moduleId() {
      return this.$route.params.moduleId
    },

    moduleTitle() {
      return this.moduleData ? this.moduleData.moduleName : ''
    },

    totalQuestions() {
      return this.shuffledQuestions.length
    },

    currentQuestion() {
      return this.shuffledQuestions[this.currentIndex] || null
    },

    isLastQuestion() {
      return this.currentIndex === this.totalQuestions - 1
    },

    progressPercent() {
      if (this.totalQuestions === 0) return 0
      return ((this.currentIndex + 1) / this.totalQuestions) * 100
    },

    // Has the CURRENT question been answered? Controls whether Next/Submit is enabled.
    isCurrentAnswered() {
      if (!this.currentQuestion) return false
      const saved = this.answers[this.currentQuestion.id]
      if (this.currentQuestion.answerType === 'multiple') {
        return Array.isArray(saved) && saved.length > 0
      }
      return !!saved
    },

    // v-model target for single-answer (radio) questions.
    // Getter reads from `answers`, setter writes back into `answers` —
    // this is how the selection survives clicking Back and returning later.
    selectedAnswer: {
      get() {
        return this.currentQuestion ? this.answers[this.currentQuestion.id] || null : null
      },
      set(value) {
        this.answers = { ...this.answers, [this.currentQuestion.id]: value }
      }
    },

    // v-model target for multi-answer (checkbox) questions.
    selectedAnswers: {
      get() {
        if (!this.currentQuestion) return []
        const saved = this.answers[this.currentQuestion.id]
        return Array.isArray(saved) ? saved : []
      },
      set(value) {
        this.answers = { ...this.answers, [this.currentQuestion.id]: [...value] }
      }
    }
  },

  created() {
    this.loadModule()
  },

  methods: {
    loadModule() {
      const data = MODULE_DATA[this.moduleId]
      if (!data) {
        console.error(`No question data found for "${this.moduleId}"`)
        return
      }
      this.moduleData = data
      this.shuffledQuestions = shuffleOrder(data.questions)
      this.currentIndex = 0
      this.answers = {}
    },

    goNext() {
      if (this.currentIndex < this.totalQuestions - 1) {
        this.currentIndex++
      }
    },

    goBack() {
      if (this.currentIndex > 0) {
        this.currentIndex--
      }
    },

    toggleMultipleAnswer(value) {
      const current = Array.isArray(this.selectedAnswers) ? [...this.selectedAnswers] : []
      const index = current.indexOf(value)
      if (index >= 0) {
        current.splice(index, 1)
      } else {
        current.push(value)
      }
      this.selectedAnswers = current
    },

    answersMatch(expected, saved) {
      if (Array.isArray(expected)) {
        if (!Array.isArray(saved)) return false
        const left = [...expected].map(String).sort()
        const right = [...saved].map(String).sort()
        return left.length === right.length && left.every((value, index) => value === right[index])
      }
      return String(saved) === String(expected)
    },

    optionLabel(question, value) {
      const option = (question.options || []).find((item) => String(item.value) === String(value))
      if (!option) return String(value).toUpperCase()
      return `${String(option.value).toUpperCase()}) ${option.text}`
    },

    formatAnswer(question, answer) {
      if (answer == null || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
        return 'No answer'
      }
      const values = Array.isArray(answer) ? answer : [answer]
      return values.map((value) => this.optionLabel(question, value)).join('; ')
    },

    submitQuiz() {
      const typeTotals = {
        standard: { correct: 0, total: 0 },
        'scenario-based': { correct: 0, total: 0 },
        simulation: { correct: 0, total: 0 }
      }

      let correctCount = 0
      const review = []

      for (const question of this.shuffledQuestions) {
        const typeKey = typeTotals[question.questionType] ? question.questionType : 'standard'
        typeTotals[typeKey].total += 1
        const selectedAnswer = this.answers[question.id]
        const isCorrect = this.answersMatch(question.correctAnswer, selectedAnswer)
        if (isCorrect) {
          typeTotals[typeKey].correct += 1
          correctCount += 1
        }

        review.push({
          id: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          selectedAnswerText: this.formatAnswer(question, selectedAnswer),
          correctAnswerText: this.formatAnswer(question, question.correctAnswer),
          explanation: question.explanation || '',
          isCorrect,
          attemptRecorded: true
        })
      }

      const totalQuestions = this.shuffledQuestions.length
      const percentageScore = totalQuestions === 0
        ? 0
        : Math.round((correctCount / totalQuestions) * 100)

      const results = {
        moduleId: this.moduleId,
        moduleName: this.moduleTitle,
        score: correctCount,
        totalPoints: totalQuestions,
        percentageScore,
        passed: percentageScore >= 70,
        breakdown: typeTotals,
        review
      }

      sessionStorage.setItem(`quiz-results-${this.moduleId}`, JSON.stringify(results))
      this.$router.push(`/quiz/${this.moduleId}/results`)
    }
  },

  watch: {
    moduleId() {
      this.loadModule()
    }
  }
}