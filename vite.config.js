import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@appvue': fileURLToPath(new URL('./javascript/framework/vue', import.meta.url)),
      '@appcss': fileURLToPath(new URL('./css/framework/tailwind', import.meta.url))
    }
  }
})