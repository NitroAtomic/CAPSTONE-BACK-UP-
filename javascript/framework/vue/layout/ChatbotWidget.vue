<template>
  <div v-show="!hidden" class="chatbot-widget">
    <section
      class="chatbot-panel"
      :class="{ 'chatbot-panel-open': isOpen }"
      aria-label="CyberWise chat"
    >
      <header class="chatbot-header">
        <div class="chatbot-assistant-information">
          <div class="chatbot-assistant-icon"><img src="/images/icons/cyberwise-logo.png" alt=""></div>
          <div class="chatbot-assistant-details">
            <h2>CyberWise</h2>
            <p class="chatbot-status">Security awareness assistant</p>
          </div>
        </div>

        <button
          type="button"
          class="chatbot-close-button"
          aria-label="Close CyberWise"
          @click="isOpen = false"
        >
          ×
        </button>
      </header>

      <div
        ref="conversation"
        class="chatbot-conversation"
        aria-live="polite"
      >
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="chatbot-message"
          :class="{
            'chatbot-user-message': message.role === 'user',
            'chatbot-assistant-message': message.role === 'assistant',
            'chatbot-assistant-message chatbot-warning-message': message.role === 'warning'
          }"
          :role="message.role === 'warning' ? 'alert' : null"
        >
          <!-- Assistant replies: paragraphs, lists and bold, built as real
               elements rather than v-html, so nothing in a reply can run. -->
          <div v-if="message.blocks" class="chatbot-message-body">
            <template v-for="(block, b) in message.blocks" :key="b">
              <p v-if="block.type === 'p'" class="chatbot-para">
                <template v-for="(part, i) in block.parts" :key="i"><strong v-if="part.bold">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template>
              </p>
              <component :is="block.type" v-else class="chatbot-list">
                <li v-for="(item, j) in block.items" :key="j">
                  <template v-for="(part, i) in item" :key="i"><strong v-if="part.bold">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template>
                </li>
              </component>
            </template>

            <router-link
              v-if="message.learnMore"
              :to="message.learnMore.path"
              class="chatbot-learn-more"
              @click="isOpen = false"
            >
              Learn more: {{ message.learnMore.title }} →
            </router-link>
          </div>

          <span v-else v-for="(para, i) in message.text.split('\n\n')" :key="i" class="chatbot-para">{{ para }}</span>
        </div>

        <div v-if="busy" class="chatbot-message chatbot-assistant-message chatbot-typing" aria-label="CyberWise is typing">
          <span></span><span></span><span></span>
        </div>

        <div v-if="showStarters" class="chatbot-starters">
          <p class="chatbot-starters-label">Try asking:</p>
          <button
            v-for="question in starters"
            :key="question"
            type="button"
            class="chatbot-starter"
            @click="askStarter(question)"
          >
            {{ question }}
          </button>
        </div>
      </div>

      <form class="chatbot-message-form" @submit.prevent="sendMessage">
        <label for="chatbot-message-input" class="chatbot-hidden-label">
          Ask CyberWise something
        </label>

        <div class="chatbot-input-container">
          <input
            id="chatbot-message-input"
            ref="input"
            v-model="draft"
            type="text"
            name="message"
            maxlength="1000"
            :placeholder="busy ? 'CyberWise is typing...' : 'Ask CyberWise...'"
            :disabled="busy"
            autocomplete="off"
          >
          <button
            type="submit"
            class="chatbot-send-button"
            :disabled="busy || !draft.trim()"
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </form>
    </section>

    <button
      type="button"
      class="chatbot-floating-button"
      aria-label="Open CyberWise"
      @click="isOpen = !isOpen"
    >
      <span class="chatbot-floating-button-icon">
        <img src="/images/icons/cyberwise-logo.png" alt="">
      </span>
    </button>
  </div>
</template>

<script src="./ChatbotWidget.js"></script>
