<template>
  <SiteHeader />
  <router-view />
  <ChatbotWidget />
</template>

<script>
import SiteHeader from './layout/SiteHeader.vue'
import ChatbotWidget from './layout/ChatbotWidget.vue'

export default {
  components: {
    SiteHeader,
    ChatbotWidget
  }
}
</script>
