export default {
  name: 'ChatbotWidget',

  data() {
    return {
      isOpen: false,
      draft: '',
      messages: [
        {
          role: 'assistant',
          text: "Hello! I'm your AI Assistant. What can I help you with regarding social engineering?"
        }
      ]
    }
  },

  methods: {
    sendMessage() {
      const text = this.draft.trim()
      if (!text) return

      this.messages.push({ role: 'user', text })
      this.draft = ''
      this.messages.push({
        role: 'assistant',
        text: 'The live assistant connection is not wired yet. Use the free modules and quizzes while this chat is being connected.'
      })

      this.$nextTick(() => {
        const panel = this.$refs.conversation
        if (panel) panel.scrollTop = panel.scrollHeight
      })
    }
  }
}
