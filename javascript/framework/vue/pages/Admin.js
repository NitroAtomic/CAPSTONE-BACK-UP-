// Backend and integration: IamAtomic
import auth from '../services/auth.js'

const BLANK = {
  module_title: '', slug: '', description: '', module_type: 'Free',
  category: '', video_url: ''
}

const BLANK_QUESTION = { question_text: '', options: ['', '', '', ''], correct_option_index: 0, order_index: 0 }

export default {
  name: 'Admin',

  data() {
    return {
      modules: [],
      form: { ...BLANK },
      editingId: null,
      loading: true,
      busy: false,
      message: '',
      messageType: 'error',

      // Quiz question management: expanded per-module, one at a time, so the
      // panel always has a single unambiguous quiz_id to act against.
      quizModuleId: null,
      quizId: null,
      questions: [],
      quizLoading: false,
      questionForm: { ...BLANK_QUESTION },
      editingQuestionId: null,
      questionBusy: false,
      questionMessage: ''
    }
  },

  computed: {
    isEditing() {
      return this.editingId !== null
    },
    isEditingQuestion() {
      return this.editingQuestionId !== null
    }
  },

  async created() {
    // Hiding this page is a convenience. The server checks the role on every
    // one of these endpoints, so a non-admin calling them directly is refused
    // regardless of what the interface shows.
    if (!auth.isSignedIn()) {
      this.$router.replace('/login')
      return
    }
    if (!auth.isAdmin()) {
      this.$router.replace('/dashboard')
      return
    }
    await this.load()
  },

  methods: {
    show(text, type = 'error') {
      this.message = text
      this.messageType = type
    },

    async load() {
      this.loading = true
      try {
        this.modules = await auth.getModules()
      } catch (err) {
        this.show(err.message)
      } finally {
        this.loading = false
      }
    },

    startEdit(mod) {
      this.editingId = mod.module_id
      this.form = {
        module_title: mod.module_title || '',
        slug: mod.slug || '',
        description: mod.description || '',
        module_type: mod.module_type || 'Free',
        category: mod.category || '',
        video_url: mod.video_url || ''
      }
      this.show('')
    },

    resetForm() {
      this.editingId = null
      this.form = { ...BLANK }
    },

    cancelEdit() {
      this.resetForm()
      this.show('')
    },

    async save() {
      if (this.busy) return

      if (!this.form.module_title.trim()) return this.show('Enter a module title.')
      if (!this.form.slug.trim()) return this.show('Enter a slug.')

      // The slug is what links a module page to its database row, so it has
      // to stay URL safe.
      if (!/^[a-z0-9-]+$/.test(this.form.slug.trim())) {
        return this.show('The slug can only contain lowercase letters, numbers and hyphens.')
      }

      this.busy = true
      try {
        const wasEditing = this.isEditing

        if (wasEditing) await auth.adminUpdateModule(this.editingId, this.form)
        else await auth.adminCreateModule(this.form)

        // resetForm rather than cancelEdit, because cancelEdit clears the
        // message and the confirmation would vanish before being read.
        this.resetForm()
        await this.load()
        this.show(wasEditing ? 'Module updated.' : 'Module created.', 'success')
      } catch (err) {
        this.show(err.message)
      } finally {
        this.busy = false
      }
    },

    async remove(mod) {
      // Deleting a module takes its quiz and any recorded progress with it,
      // so this asks first rather than acting on a single click.
      const ok = window.confirm(
        `Delete "${mod.module_title}"? Its quiz and any saved progress for it will go too.`
      )
      if (!ok) return

      this.busy = true
      try {
        await auth.adminDeleteModule(mod.module_id)
        this.show('Module deleted.', 'success')
        await this.load()
      } catch (err) {
        this.show(err.message)
      } finally {
        this.busy = false
      }
    },

    /* ---------------- quiz question management ---------------- */

    async manageQuiz(mod) {
      // Toggle closed if the same module's panel is already open.
      if (this.quizModuleId === mod.module_id) {
        this.closeQuizPanel()
        return
      }

      this.quizModuleId = mod.module_id
      this.quizId = null
      this.questions = []
      this.resetQuestionForm()
      this.questionMessage = ''
      this.quizLoading = true

      try {
        const quiz = await auth.getQuizByModule(mod.slug)
        this.quizId = quiz.quiz_id
        this.questions = await auth.adminGetQuizQuestions(this.quizId)
      } catch (err) {
        this.questionMessage = err.message
      } finally {
        this.quizLoading = false
      }
    },

    closeQuizPanel() {
      this.quizModuleId = null
      this.quizId = null
      this.questions = []
      this.resetQuestionForm()
    },

    resetQuestionForm() {
      this.editingQuestionId = null
      this.questionForm = { ...BLANK_QUESTION, options: ['', '', '', ''], order_index: this.questions.length }
    },

    startEditQuestion(q) {
      this.editingQuestionId = q.question_id
      this.questionForm = {
        question_text: q.question_text,
        options: Array.isArray(q.options) ? [...q.options] : JSON.parse(q.options || '[]'),
        correct_option_index: q.correct_option_index,
        order_index: q.order_index
      }
      this.questionMessage = ''
    },

    cancelEditQuestion() {
      this.resetQuestionForm()
      this.questionMessage = ''
    },

    async saveQuestion() {
      if (this.questionBusy) return

      const text = this.questionForm.question_text.trim()
      const options = this.questionForm.options.map((o) => o.trim())

      if (!text) return (this.questionMessage = 'Enter the question text.')
      if (options.some((o) => !o)) return (this.questionMessage = 'Fill in all four options.')

      this.questionBusy = true
      try {
        const payload = {
          question_text: text,
          options,
          correct_option_index: Number(this.questionForm.correct_option_index),
          order_index: Number(this.questionForm.order_index) || 0
        }

        if (this.isEditingQuestion) {
          await auth.adminUpdateQuestion(this.editingQuestionId, payload)
        } else {
          await auth.adminAddQuestion(this.quizId, payload)
        }

        this.questions = await auth.adminGetQuizQuestions(this.quizId)
        this.resetQuestionForm()
        this.questionMessage = ''
      } catch (err) {
        this.questionMessage = err.message
      } finally {
        this.questionBusy = false
      }
    },

    async removeQuestion(q) {
      const ok = window.confirm('Delete this question?')
      if (!ok) return

      this.questionBusy = true
      try {
        await auth.adminDeleteQuestion(q.question_id)
        this.questions = await auth.adminGetQuizQuestions(this.quizId)
        if (this.editingQuestionId === q.question_id) this.resetQuestionForm()
      } catch (err) {
        this.questionMessage = err.message
      } finally {
        this.questionBusy = false
      }
    }
  }
}
