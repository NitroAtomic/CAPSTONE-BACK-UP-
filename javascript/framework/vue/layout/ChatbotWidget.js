// Backend and integration: IamAtomic
import auth from '../services/auth.js'
import examMode from '../services/examMode.js'

const GREETING = "Hi, I'm CyberWise. Ask me about phishing, scam calls, passwords, or anything else about staying safe as a remote worker."

// Shown before the first question, so a new visitor knows what kind of thing
// to ask. The last two are deliberately "it's happening to me" questions,
// which is when people actually need help.
const STARTERS = [
  'What is smishing?',
  'How do I spot a fake recruiter?',
  'Someone called saying they are from IT',
  'I think I clicked a bad link'
]

// How many earlier messages go with each question. Enough to follow a
// conversation, small enough to keep each request light.
const HISTORY_LENGTH = 6

// Splits "**bold**" out of a line so the template can render it as <strong>
// without ever using v-html. Nothing the assistant returns is treated as HTML,
// so a reply containing <script> would show as text, not run.
function inline(text) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => (part.length > 4 && part.startsWith('**') && part.endsWith('**'))
      ? { bold: true, text: part.slice(2, -2) }
      : { bold: false, text: part.replace(/\*\*/g, '') })
}

// Turns a reply into paragraphs and lists. The model is asked to use "- "
// for list items and **bold** for key terms; without this those arrived as
// literal asterisks.
function toBlocks(text) {
  const blocks = []
  let paragraph = []
  let list = null

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'p', parts: inline(paragraph.join(' ')) })
    paragraph = []
  }
  const flushList = () => {
    if (list) blocks.push(list)
    list = null
  }

  for (const raw of String(text).split('\n')) {
    const line = raw.trim()
    if (!line) { flushParagraph(); flushList(); continue }

    const bullet = line.match(/^[-*•]\s+(.+)$/)
    const numbered = line.match(/^\d+[.)]\s+(.+)$/)

    if (bullet || numbered) {
      flushParagraph()
      const type = numbered ? 'ol' : 'ul'
      if (!list || list.type !== type) { flushList(); list = { type, items: [] } }
      list.items.push(inline((numbered || bullet)[1]))
      continue
    }

    flushList()
    paragraph.push(line.replace(/^#{1,6}\s+/, ''))
  }

  flushParagraph()
  flushList()
  return blocks
}

function assistantMessage(text, learnMore = null) {
  return { role: 'assistant', text, blocks: toBlocks(text), learnMore }
}

export default {
  name: 'ChatbotWidget',

  data() {
    return {
      isOpen: false,
      draft: '',
      busy: false,
      starters: STARTERS,
      // One id per page visit, so a memory-based workflow such as n8n can
      // tell conversations apart. Not linked to the user's account.
      sessionId: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
      messages: [assistantMessage(GREETING)]
    }
  },

  computed: {
    // No help from CyberWise while a quiz or the assessment is being taken.
    // Results pages still show it.
    hidden() {
      return /^\/quiz\/[^/]+\/question/.test(this.$route.path) || examMode.assessmentInProgress
    },

    showStarters() {
      return !this.busy && this.messages.length === 1
    }
  },

  watch: {
    // Close the panel if a quiz starts while it's open, so it doesn't pop
    // back open by itself afterwards.
    hidden(value) {
      if (value) this.isOpen = false
    }
  },

  methods: {
    askStarter(question) {
      this.draft = question
      this.sendMessage()
    },

    // The earlier conversation, without the greeting or any warnings.
    recentHistory() {
      return this.messages
        .slice(1)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-HISTORY_LENGTH)
        .map((m) => ({ role: m.role, text: m.text }))
    },

    async sendMessage() {
      const text = this.draft.trim()
      if (!text || this.busy) return

      const history = this.recentHistory()
      const userMessage = { role: 'user', text }
      this.messages.push(userMessage)
      this.draft = ''
      this.busy = true
      this.scrollToEnd()

      try {
        const { reply, redacted, redactedMessage, learnMore } =
          await auth.sendChatMessage(text, history, this.sessionId)

        // The password never left the server. Swap it out of the user's own
        // bubble too, so it isn't left sitting on screen, and say why.
        if (redacted) {
          if (redactedMessage) userMessage.text = redactedMessage
          this.messages.push({
            role: 'warning',
            text: 'That message looked like it contained a password, so it was removed before being processed. Never share a password in a chat, with support staff, or with an AI assistant. If that was a real one, consider changing it.'
          })
        }

        this.messages.push(assistantMessage(reply, learnMore))
      } catch (err) {
        this.messages.push(assistantMessage("I couldn't reach CyberWise just now. Check your connection and try again in a moment."))
      } finally {
        this.busy = false
        this.scrollToEnd()
        this.$nextTick(() => this.$refs.input?.focus())
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
