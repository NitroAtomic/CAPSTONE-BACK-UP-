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
            :class="{
              'quiz-answer-option-correct': isCurrentChecked && isOptionCorrect(option.value),
              'quiz-answer-option-incorrect': isCurrentChecked && isOptionSelected(option.value) && !isOptionCorrect(option.value)
            }"
          >
            <input
              type="radio"
              name="answer"
              :value="option.value"
              v-model="selectedAnswer"
              :disabled="isCurrentChecked"
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
            :class="{
              'quiz-answer-option-correct': isCurrentChecked && isOptionCorrect(option.value),
              'quiz-answer-option-incorrect': isCurrentChecked && isOptionSelected(option.value) && !isOptionCorrect(option.value)
            }"
          >
            <input
              type="checkbox"
              :value="option.value"
              :checked="selectedAnswers.includes(option.value)"
              :disabled="isCurrentChecked"
              @change="toggleMultipleAnswer(option.value)"
            >
            <span>{{ option.text }}</span>
          </label>
        </div>

        <!-- Immediate per-question feedback, flashed after "Check Answer" -->
        <div
          v-if="currentFeedback"
          class="quiz-feedback-panel"
          :class="currentFeedback.isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-incorrect'"
        >
          <p class="quiz-feedback-status">
            {{ currentFeedback.isCorrect ? 'Correct!' : 'Incorrect' }}
          </p>
          <p v-if="!currentFeedback.isCorrect">
            <strong>Correct answer:</strong> {{ currentFeedback.correctAnswerText }}
          </p>
          <p v-if="currentFeedback.explanation">
            <strong>Explanation:</strong> {{ currentFeedback.explanation }}
          </p>
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

        <!-- Step 1: must check the answer (see the flash feedback) before advancing -->
        <button
          v-if="!isCurrentChecked"
          type="button"
          class="quiz-navigation-button quiz-next-button"
          :disabled="!isCurrentAnswered"
          @click="checkAnswer"
        >
          Check Answer
        </button>

        <!-- Step 2: once checked, Next/Submit appears -->
        <button
          v-else-if="!isLastQuestion"
          type="button"
          class="quiz-navigation-button quiz-next-button"
          @click="goNext"
        >
          Next
        </button>

        <button
          v-else
          type="button"
          class="quiz-navigation-button quiz-next-button"
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