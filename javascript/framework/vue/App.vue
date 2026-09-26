<template>
  <SiteHeader />
  <router-view />
  <ChatbotWidget />
  <BackToTop />
</template>

<script>
import SiteHeader from './layout/SiteHeader.vue'
import ChatbotWidget from './layout/ChatbotWidget.vue'
import BackToTop from './layout/BackToTop.vue'

export default {
  components: {
    SiteHeader,
    ChatbotWidget,
    BackToTop
  }
}
</script>
