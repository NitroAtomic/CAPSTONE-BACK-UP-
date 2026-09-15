<template>
  <main class="quiz-page">
    <section class="quiz-container">

      <!-- Quiz Header -->
      <div class="quiz-header">
        <div>
          <h1>{{ moduleTitle }} Assessment</h1>
        </div>
        <p class="quiz-question-counter">
          Question {{ currentIndex + 1 }} of {{ totalQuestions }}
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="quiz-progress-container">
        <div class="quiz-progress-bar" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <!-- Current Question -->
      <div v-if="currentQuestion" class="quiz-question-content">

        <span class="quiz-question-type">
          {{ currentQuestion.questionType === 'scenario-based' ? 'Scenario-Based' : 'Standard' }}
        </span>

        <h2 class="quiz-question-text">
          {{ currentQuestion.questionText }}
        </h2>

        <!-- Single-answer question: radio buttons -->
        <div v-if="currentQuestion.answerType === 'single'" class="quiz-answer-list">
          <label
            v-for="option in currentQuestion.options"
            :key="option.value"
            class="quiz-answer-option"
          >
            <input
              type="radio"
              name="answer"
              :value="option.value"
              v-model="selectedAnswer"
            >
            <span>{{ option.text }}</span>
          </label>
        </div>

        <!-- Multi-answer question ("Select ALL that apply"): checkboxes -->
        <div v-else class="quiz-answer-list">
          <label
            v-for="option in currentQuestion.options"
            :key="option.value"
            class="quiz-answer-option"
          >
            <input
              type="checkbox"
              :value="option.value"
              :checked="selectedAnswers.includes(option.value)"
              @change="toggleMultipleAnswer(option.value)"
            >
            <span>{{ option.text }}</span>
          </label>
        </div>

      </div>

      <!-- Navigation -->
      <div class="quiz-navigation">
        <button
          type="button"
          class="quiz-navigation-button"
          :disabled="currentIndex === 0"
          @click="goBack"
        >
          Back
        </button>

        <button
          v-if="!isLastQuestion"
          type="button"
          class="quiz-navigation-button quiz-next-button"
          :disabled="!isCurrentAnswered"
          @click="goNext"
        >
          Next
        </button>

        <button
          v-else
          type="button"
          class="quiz-navigation-button quiz-next-button"
          :disabled="!isCurrentAnswered"
          @click="submitQuiz"
        >
          Submit
        </button>
      </div>

    </section>
  </main>
</template>

<script src="./QuizQuestion.js"></script>
<!-- Styles now load once, globally, via css/framework/tailwind/main.css (see main.js).
     Do not re-add a per-component <style src> here — see the note at the top
     of main.css for why that breaks the @layer components build. -->