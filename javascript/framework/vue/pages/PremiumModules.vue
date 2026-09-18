<template>
  <main class="premium-modules-page">

    <header class="premium-modules-heading">
      <h1>Role-based modules</h1>
      <p>
        Scenarios aimed at freelancers, virtual assistants, and contractors,
        where the attack is tailored rather than generic.
      </p>
    </header>

    <p v-if="!isPremium" class="dash-upgrade-note">
      These modules are part of the Premium plan.
      <router-link to="/premium-subscription">Go Premium</router-link>
      to open them.
    </p>

    <ul class="premium-modules-list">
      <li v-for="mod in modules" :key="mod.slug" class="premium-modules-item">
        <div>
          <h2>{{ mod.title }}</h2>
          <p>{{ mod.summary }}</p>
        </div>

        <router-link v-if="isPremium" class="premium-modules-open"
                     :to="'/premium-modules/' + mod.slug">
          Open
        </router-link>
        <span v-else class="premium-modules-locked">Locked</span>
      </li>
    </ul>

  </main>
</template>

<script>
import PremiumModules from './PremiumModules.js'
export default PremiumModules
</script>
