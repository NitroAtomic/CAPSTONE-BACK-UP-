<!--
  Backend and integration: IamAtomic

  Embedded video player for a module's curated video source. Previously each
  module just linked out to YouTube ("Video Source: <a href target=_blank>");
  this actually embeds it inline using the .module-video-section /
  .video-player classes that already existed in modules.css but were unused.

  Kept deliberately simple: it only ever embeds a youtube.com/watch or
  youtu.be link (the only kind used in this codebase), and falls back to a
  plain "watch on YouTube" link for anything it can't parse rather than
  guessing at an iframe src.
-->
<template>
  <section class="module-video-section">
    <h2>Curated Video</h2>

    <div class="video-player" v-if="embedUrl">
      <iframe
        :src="embedUrl"
        :title="title"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>

    <p v-else class="video-player">
      <a :href="url" target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
    </p>

    <p>
      <strong>Source:</strong>
      <a :href="url" target="_blank" rel="noopener noreferrer">{{ title }}</a>
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
    embedUrl() {
      const match = this.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
      return match ? `https://www.youtube.com/embed/${match[1]}` : null
    }
  }
}
</script>
