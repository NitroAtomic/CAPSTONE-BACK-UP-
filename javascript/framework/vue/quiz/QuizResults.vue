<template>
  <main class="quiz-results-page">
    <section v-if="results" class="quiz-results-container">
      <div class="quiz-results-icon">
        {{ results.passed ? '✓' : '!' }}
      </div>

      <h1>{{ results.moduleName }} Assessment Complete!</h1>
      <p v-if="results.passed">You passed with {{ results.percentageScore }}%.</p>
      <p v-else>Score {{ results.percentageScore }}%. A 70% score is required to pass. You can retake this quiz.</p>

      <div class="quiz-score">
        <span class="quiz-score-earned">{{ results.score }}</span>
        <span class="quiz-score-total">/{{ results.totalPoints }}</span>
      </div>

      <div class="quiz-results-breakdown">
        <div class="quiz-result-row">
          <span>Standard</span>
          <span><strong>{{ breakdown.standard.correct }}/{{ breakdown.standard.total }}</strong> correct</span>
        </div>
        <div class="quiz-result-row">
          <span>Scenario-based</span>
          <span><strong>{{ breakdown['scenario-based'].correct }}/{{ breakdown['scenario-based'].total }}</strong> correct</span>
        </div>
        <div class="quiz-result-row">
          <span>Simulation</span>
          <span><strong>{{ breakdown.simulation.correct }}/{{ breakdown.simulation.total }}</strong> correct</span>
        </div>
      </div>

      <section v-if="reviewItems.length" class="quiz-answer-review">
        <h2>Correct answers and explanations</h2>
        <article
          v-for="(item, index) in reviewItems"
          :key="item.id"
          class="quiz-review-card"
          :class="{
            'quiz-review-card-correct': item.attemptRecorded && item.isCorrect,
            'quiz-review-card-incorrect': item.attemptRecorded && !item.isCorrect
          }"
        >
          <p class="quiz-review-status">
            Question {{ index + 1 }}<template v-if="item.attemptRecorded"> — {{ item.isCorrect ? 'Correct' : 'Incorrect' }}</template>
          </p>
          <h3>{{ item.questionText }}</h3>
          <p v-if="item.attemptRecorded"><strong>Your answer:</strong> {{ item.selectedAnswerText }}</p>
          <p><strong>Correct answer:</strong> {{ item.correctAnswerText }}</p>
          <p v-if="item.explanation"><strong>Explanation:</strong> {{ item.explanation }}</p>
        </article>
      </section>

      <div class="quiz-results-actions">
        <button type="button" class="quiz-results-button" @click="retakeQuiz">
          Retake quiz
        </button>

        <router-link
          v-if="results.passed && nextModule"
          :to="nextModule.path"
          class="quiz-results-button quiz-results-primary-button"
        >
          {{ nextModule.label }}
        </router-link>
        <router-link
          v-else
          :to="modulePath"
          class="quiz-results-button quiz-results-primary-button"
        >
          Back to module
        </router-link>
      </div>
    </section>

    <section v-else class="quiz-results-container">
      <h1>No quiz results yet</h1>
      <p>Complete a module quiz to see your score.</p>
      <div class="quiz-results-actions">
        <router-link to="/" class="quiz-results-button quiz-results-primary-button">
          Back to Home
        </router-link>
      </div>
    </section>
  </main>
</template>

<script src="./QuizResults.js"></script>
