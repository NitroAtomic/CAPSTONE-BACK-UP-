<!--
  Backend and integration: IamAtomic

  Embedded video player for a module's curated video source. Previously each
  module just linked out to YouTube ("Video Source: <a href target=_blank>");
  this actually embeds it inline using the .module-video-section /
  .video-player classes that already existed in modules.css but were unused.

  Kept deliberately simple: it only ever embeds a youtube.com/watch or
  youtu.be link. Anything else (an article, a guide, a PDF) is shown as a
  "Curated Resource" card that says what it opens, rather than guessing at
  an iframe src.
-->
<template>
  <section class="module-video-section">
    <h2>{{ embedUrl ? 'Curated Video' : 'Curated Resource' }}</h2>

    <div class="video-player" v-if="embedUrl">
      <iframe
        :src="embedUrl"
        :title="title"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>

    <!-- Not a YouTube video (an article, guide or PDF): say what it is and
         where it opens, rather than a "Watch on YouTube" button that opens
         a PDF. -->
    <a v-else class="module-resource-card" :href="url" target="_blank" rel="noopener noreferrer">
      <span class="module-resource-kind">{{ resourceKind }}</span>
      <span class="module-resource-action">Open {{ resourceKind.toLowerCase() }} ↗</span>
      <span class="module-resource-host">{{ host }}</span>
    </a>

    <p>
      <strong>Source:</strong>{{ ' ' }}<a :href="url" target="_blank" rel="noopener noreferrer">{{ title }}</a>
    </p>
  </section>
</template>

<script>
export default {
  name: 'ModuleVideo',
  props: {
    url: { type: String, required: true },
    title: { type: String, required: true }
  },
  computed: {
    // "PDF guide" for .pdf links, "Article" for anything else that isn't a
    // YouTube video.
    resourceKind() {
      return /\.pdf($|[?#])/i.test(this.url) ? 'PDF guide' : 'Article'
    },

    host() {
      try { return new URL(this.url).hostname.replace(/^www\./, '') } catch { return '' }
    },

    embedUrl() {
      const match = this.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
      return match ? `https://www.youtube.com/embed/${match[1]}` : null
    }
  }
}
</script>
