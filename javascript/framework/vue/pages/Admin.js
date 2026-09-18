// Backend and integration: IamAtomic
import auth from '../services/auth.js'

const BLANK = { module_title: '', slug: '', description: '', module_type: 'Free', category: '' }

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
      messageType: 'error'
    }
  },

  computed: {
    isEditing() {
      return this.editingId !== null
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
        category: mod.category || ''
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
    }
  }
}
