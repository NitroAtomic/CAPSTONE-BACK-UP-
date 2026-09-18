// Backend and integration: IamAtomic
import auth from '../services/auth.js'

export default {
  name: 'ChatbotWidget',

  data() {
    return {
      isOpen: false,
      draft: '',
      busy: false,
      messages: [
        {
          role: 'assistant',
          text: "Hello! I'm your AI Assistant. Ask me about phishing, scam calls, passwords, or anything else on staying safe as a remote worker."
        }
      ]
    }
  },

  methods: {
    async sendMessage() {
      const text = this.draft.trim()
      if (!text || this.busy) return

      this.messages.push({ role: 'user', text })
      this.draft = ''
      this.busy = true
      this.scrollToEnd()

      try {
        const reply = await auth.sendChatMessage(text)
        this.messages.push({ role: 'assistant', text: reply })
      } catch (err) {
        // Say what actually went wrong rather than leaving the question
        // sitting there unanswered.
        this.messages.push({
          role: 'assistant',
          text: 'I could not reach the assistant just now. Check that the backend is running, then try again.'
        })
      } finally {
        this.busy = false
        this.scrollToEnd()
      }
    },

    scrollToEnd() {
      this.$nextTick(() => {
        const panel = this.$refs.conversation
        if (panel) panel.scrollTop = panel.scrollHeight
      })
    }
  }
}
