<template>
  <main class="assess-page">

    <!-- Intro -->
    <section v-if="stage === 'intro'" class="assess-card">
      <h1>{{ meta.title }}</h1>
      <p class="assess-lead">{{ meta.description }}</p>

      <ul class="assess-facts">
        <li>{{ meta.totalQuestions }} questions</li>
        <li>Six topics</li>
        <li>No time limit, and you can retake it</li>
      </ul>

      <p class="assess-note">
        Your result is saved to your dashboard and used to recommend which
        modules to take next.
      </p>

      <button class="auth-submit" type="button" @click="start">Start assessment</button>
    </section>

    <!-- Questions -->
    <section v-else-if="stage === 'question' && current" class="assess-card">
      <p class="assess-counter">Question {{ currentIndex + 1 }} of {{ total }}</p>

      <div class="assess-progress" role="progressbar" :aria-valuenow="progressPercent"
           aria-valuemin="0" aria-valuemax="100">
        <span class="assess-progress-bar" :style="{ width: progressPercent + '%' }"></span>
      </div>

      <p class="assess-topic">{{ topicLabel(current.topic) }}</p>
      <h2 class="assess-question">{{ current.questionText }}</h2>

      <div class="assess-options">
        <label v-for="option in current.options" :key="option.value" class="assess-option">
          <input v-if="isMultiAnswer" type="checkbox" :value="option.value"
                 :checked="selectedMulti.includes(option.value)"
                 @change="toggleMulti(option.value)">
          <input v-else type="radio" name="assess-answer" :value="option.value"
                 v-model="selected">
          <span>{{ option.text }}</span>
        </label>
      </div>

      <button class="auth-submit" type="button" :disabled="!canSubmitAnswer" @click="submitAnswer">
        {{ isLastQuestion ? 'Finish assessment' : 'Next question' }}
      </button>
    </section>

    <!-- Result -->
    <section v-else-if="stage === 'result' && result" class="assess-card assess-card-wide">
      <h1>Your awareness level: {{ result.level.label }}</h1>
      <p class="assess-lead">{{ result.level.blurb }}</p>

      <div class="assess-score">
        <span class="assess-score-value">{{ result.score }}</span>
        <span class="assess-score-total">/{{ result.total }}</span>
        <span class="assess-score-percent">{{ result.percent }}%</span>
      </div>

      <p v-if="saveState === 'saved'" class="quiz-save-note">Saved to your dashboard.</p>
      <p v-else-if="saveState === 'saving'" class="quiz-save-note">Saving to your dashboard...</p>
      <p v-else-if="saveState === 'failed'" class="quiz-save-note quiz-save-note-failed">
        Your result is shown here but could not be saved to your dashboard.
      </p>

      <h2 class="assess-subheading">How you did by topic</h2>
      <ul class="assess-topics">
        <li v-for="(tally, topic) in result.byTopic" :key="topic" class="assess-topic-row">
          <span>{{ topicLabel(topic) }}</span>
          <span class="assess-topic-score">
            {{ tally.correct }}/{{ tally.total }}
            <small v-if="result.weakAreas.includes(topic)">focus here</small>
          </span>
        </li>
      </ul>

      <template v-if="result.weakAreas.length">
        <h2 class="assess-subheading">Where to focus next</h2>
        <p class="assess-note">
          These topics had the most wrong answers. The modules for them are the
          best place to start.
        </p>
        <ul class="assess-weak">
          <li v-for="topic in result.weakAreas" :key="topic">{{ topicLabel(topic) }}</li>
        </ul>
      </template>

      <h2 class="assess-subheading">Review</h2>
      <ol class="assess-review">
        <li v-for="answer in answers" :key="answer.id" class="assess-review-item">
          <p class="assess-review-verdict">
            {{ answer.correct ? 'Correct' : 'Not quite' }}
            <span class="assess-review-topic">{{ topicLabel(answer.topic) }}</span>
          </p>
          <p class="assess-review-question">{{ answer.questionText }}</p>
          <p class="assess-review-line">
            Your answer: {{ formatAnswer(questionById(answer.id), answer.given) }}
          </p>
          <p v-if="!answer.correct" class="assess-review-line">
            Correct answer: {{ formatAnswer(questionById(answer.id), answer.correctAnswer) }}
          </p>
          <p class="assess-review-explanation">{{ answer.explanation }}</p>
        </li>
      </ol>

      <div class="assess-actions">
        <button class="auth-submit" type="button" @click="retake">Retake assessment</button>
        <router-link class="assess-secondary" to="/dashboard">Back to dashboard</router-link>
      </div>
    </section>

  </main>
</template>

<script>
import Assessment from './Assessment.js'
export default Assessment
</script>
