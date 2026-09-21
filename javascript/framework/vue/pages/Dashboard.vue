<template>
  <main class="dash-page">

    <p v-if="loading" class="dash-status">Loading your progress...</p>

    <p v-else-if="error" class="auth-message auth-message-error">{{ error }}</p>

    <template v-else>

      <header class="dash-heading">
        <h1>Welcome back, {{ firstName }}</h1>
        <p>Here's your progress so far</p>
      </header>

      <section class="dash-stats">
        <div class="dash-stat">
          <span class="dash-stat-label">Modules completed</span>
          <strong class="dash-stat-value">{{ completedCount }}</strong>
        </div>

        <div class="dash-stat">
          <span class="dash-stat-label">Average quiz score</span>
          <strong class="dash-stat-value">{{ averageScore }}</strong>
        </div>

        <div class="dash-stat">
          <span class="dash-stat-label">Weak areas found</span>
          <strong class="dash-stat-value">{{ weakAreas.length }}</strong>
        </div>
      </section>

      <section v-if="recommendations.length" class="dash-section">
        <h2>Recommended for you</h2>
        <p class="dash-section-note">Based on your assessment results</p>

        <div class="dash-cards">
          <router-link v-for="item in recommendations" :key="item.module_id"
                       class="dash-card dash-card-link"
                       :to="'/modules/' + item.slug">
            <h3>{{ item.module_title }}</h3>
            <p>Start this module</p>
          </router-link>
        </div>
      </section>

      <section v-if="topicScores.length" class="dash-section">
        <h2>Assessment breakdown</h2>
        <p class="dash-section-note">
          How you scored in each topic, {{ assessment.score }}/{{ assessment.total }} overall
          ({{ assessmentPercent }}%)
        </p>

        <ul class="dash-chart">
          <li v-for="topic in topicScores" :key="topic.slug" class="dash-chart-row">
            <span class="dash-chart-label">{{ topic.label }}</span>
            <span class="dash-chart-track">
              <span class="dash-chart-bar" :style="{ width: topic.percent + '%' }"></span>
            </span>
            <span class="dash-chart-value">{{ topic.correct }}/{{ topic.total }}</span>
          </li>
        </ul>
      </section>

      <section v-if="weakAreas.length" class="dash-section">
        <h2>Your weak areas</h2>
        <p class="dash-section-note">Topics to focus on next</p>

        <ul class="dash-list">
          <li v-for="area in weakAreas" :key="area.slug">{{ area.label }}</li>
        </ul>
      </section>

      <section v-if="quizTrend.length" class="dash-section">
        <h2>Quiz scores</h2>
        <p class="dash-section-note">Each quiz you have completed, oldest first</p>

        <ul class="dash-chart">
          <li v-for="(entry, i) in quizTrend" :key="i" class="dash-chart-row">
            <span class="dash-chart-label">{{ entry.label }}</span>
            <span class="dash-chart-track">
              <span class="dash-chart-bar" :style="{ width: entry.percent + '%' }"></span>
            </span>
            <span class="dash-chart-value">{{ entry.percent }}%</span>
          </li>
        </ul>
      </section>

      <section class="dash-section">
        <h2>Quiz history</h2>

        <p v-if="!quizHistory.length" class="dash-section-note">
          No quizzes completed yet. Finish a module quiz and it will appear here.
        </p>

        <ul v-else class="dash-list">
          <li v-for="(entry, index) in quizHistory" :key="index" class="dash-list-row">
            <span>
              {{ entry.module_title }}
              <span :class="['dash-badge', passed(entry) ? 'dash-badge-pass' : 'dash-badge-fail']">
                {{ passed(entry) ? 'Pass' : 'Fail' }}
              </span>
            </span>
            <span class="dash-list-meta">
              {{ entry.score }}/{{ entry.total }} · {{ percent(entry) }}
              <small v-if="entry.date_completed"> · {{ formatDate(entry.date_completed) }}</small>
            </span>
          </li>
        </ul>
      </section>

      <p v-if="!isPremium" class="dash-upgrade-note">
        You're on the Free plan.
        <router-link to="/premium-subscription">Go Premium</router-link>
        to unlock role-based modules and the awareness assessment.
      </p>

      <p v-else-if="!assessment" class="dash-upgrade-note">
        You haven't taken the awareness assessment yet.
        <router-link to="/assessment">Take it now</router-link>
        to find out which topics to focus on.
      </p>

      <p v-else class="dash-upgrade-note">
        <router-link to="/assessment">Retake the assessment</router-link>
        or browse the
        <router-link to="/premium-modules">role-based modules</router-link>.
      </p>

    </template>

  </main>
</template>

<script>
import Dashboard from './Dashboard.js'
export default Dashboard
</script>
