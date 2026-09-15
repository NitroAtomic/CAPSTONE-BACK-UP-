<template>
  <div class="chatbot-widget">
    <section
      class="chatbot-panel"
      :class="{ 'chatbot-panel-open': isOpen }"
      aria-label="AI Assistant"
    >
      <header class="chatbot-header">
        <div class="chatbot-assistant-information">
          <div class="chatbot-assistant-icon">AI</div>
          <div class="chatbot-assistant-details">
            <h2>AI Assistant</h2>
            <p class="chatbot-status">Online</p>
          </div>
        </div>

        <button
          type="button"
          class="chatbot-close-button"
          aria-label="Close AI Assistant"
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
          :class="message.role === 'user'
            ? 'chatbot-user-message'
            : 'chatbot-assistant-message'"
        >
          {{ message.text }}
        </div>
      </div>

      <form class="chatbot-message-form" @submit.prevent="sendMessage">
        <label for="chatbot-message-input" class="chatbot-hidden-label">
          Ask the AI Assistant something
        </label>

        <div class="chatbot-input-container">
          <input
            id="chatbot-message-input"
            v-model="draft"
            type="text"
            name="message"
            placeholder="Ask the AI Assistant something..."
            autocomplete="off"
          >
          <button
            type="submit"
            class="chatbot-send-button"
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
      aria-label="Open AI Assistant"
      @click="isOpen = !isOpen"
    >
      <span class="chatbot-floating-button-icon">
        <img src="/images/icons/chatbot-icon.png" alt="">
      </span>
    </button>
  </div>
</template>

<script src="./ChatbotWidget.js"></script>
