<template>
  <main class="module-page">

    <p v-if="notFound" class="assess-note">
      That module does not exist.
      <router-link to="/premium-modules">Back to role-based modules</router-link>
    </p>

    <template v-else-if="module">
      <header class="module-heading">
        <p class="module-kicker">Role-based module</p>
        <h1>{{ module.title }}</h1>
        <p class="module-summary">{{ module.summary }}</p>
        <p class="module-audience"><strong>Who this is for:</strong> {{ module.audience }}</p>
      </header>

      <article class="module-body">
        <section v-for="section in module.sections" :key="section.heading" class="module-section">
          <h2>{{ section.heading }}</h2>
          <p v-for="(para, i) in section.body.split('\n\n')" :key="i">{{ para }}</p>
        </section>
      </article>

      <nav class="module-nav">
        <router-link to="/premium-modules">All role-based modules</router-link>
        <router-link v-if="nextModule" :to="'/premium-modules/' + nextModule.slug">
          Next: {{ nextModule.title }}
        </router-link>
      </nav>
    </template>

  </main>
</template>

<script>
import PremiumModule from './PremiumModule.js'
export default PremiumModule
</script>
