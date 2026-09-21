<template>
  <main class="admin-page">

    <header class="admin-heading">
      <h1>Module management</h1>
      <p>Create, edit and remove learning modules.</p>
    </header>

    <p v-if="message" class="auth-message" :class="'auth-message-' + messageType">
      {{ message }}
    </p>

    <section class="admin-form-section">
      <h2>{{ isEditing ? 'Edit module' : 'Add a module' }}</h2>

      <form class="auth-form" @submit.prevent="save">
        <div class="auth-field-row">
          <div class="auth-field">
            <label for="admin-title">Title</label>
            <input id="admin-title" v-model="form.module_title" type="text" placeholder="Quishing">
          </div>

          <div class="auth-field">
            <label for="admin-slug">Slug</label>
            <input id="admin-slug" v-model="form.slug" type="text" placeholder="quishing">
          </div>
        </div>

        <div class="auth-field">
          <label for="admin-description">Description</label>
          <input id="admin-description" v-model="form.description" type="text"
                 placeholder="What this module covers">
        </div>

        <div class="auth-field-row">
          <div class="auth-field">
            <label for="admin-type">Plan</label>
            <select id="admin-type" v-model="form.module_type">
              <option value="Free">Free</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          <div class="auth-field">
            <label for="admin-category">Category</label>
            <input id="admin-category" v-model="form.category" type="text" placeholder="phishing">
          </div>
        </div>

        <div class="auth-field">
          <label for="admin-video">Video URL</label>
          <input id="admin-video" v-model="form.video_url" type="text"
                 placeholder="https://www.youtube.com/watch?v=...">
        </div>

        <button class="auth-submit" type="submit" :disabled="busy">
          {{ busy ? 'Saving...' : (isEditing ? 'Save changes' : 'Create module') }}
        </button>

        <button v-if="isEditing" class="admin-cancel" type="button" @click="cancelEdit">
          Cancel
        </button>
      </form>
    </section>

    <section class="admin-list-section">
      <h2>Modules</h2>

      <p v-if="loading" class="dash-status">Loading modules...</p>

      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Plan</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mod in modules" :key="mod.module_id">
            <td>{{ mod.module_title }}</td>
            <td><code>{{ mod.slug }}</code></td>
            <td>{{ mod.module_type }}</td>
            <td class="admin-actions">
              <button type="button" @click="startEdit(mod)">Edit</button>
              <button type="button" @click="manageQuiz(mod)">
                {{ quizModuleId === mod.module_id ? 'Close quiz' : 'Manage quiz' }}
              </button>
              <button type="button" class="admin-delete" @click="remove(mod)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="quizModuleId" class="admin-form-section">
      <h2>Quiz questions</h2>

      <p v-if="quizLoading" class="dash-status">Loading questions...</p>

      <template v-else>
        <p v-if="questionMessage" class="auth-message auth-message-error">{{ questionMessage }}</p>

        <table v-if="questions.length" class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th>Correct answer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in questions" :key="q.question_id">
              <td>{{ q.order_index }}</td>
              <td>{{ q.question_text }}</td>
              <td>{{ (Array.isArray(q.options) ? q.options : []).at(q.correct_option_index) }}</td>
              <td class="admin-actions">
                <button type="button" @click="startEditQuestion(q)">Edit</button>
                <button type="button" class="admin-delete" @click="removeQuestion(q)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="dash-section-note">No questions yet. Add the first one below.</p>

        <h3>{{ isEditingQuestion ? 'Edit question' : 'Add a question' }}</h3>

        <form class="auth-form" @submit.prevent="saveQuestion">
          <div class="auth-field">
            <label for="q-text">Question</label>
            <input id="q-text" v-model="questionForm.question_text" type="text"
                   placeholder="What should you do if...">
          </div>

          <div class="auth-field-row" v-for="(opt, i) in questionForm.options" :key="i">
            <div class="auth-field">
              <label :for="'q-option-' + i">Option {{ i + 1 }}</label>
              <input :id="'q-option-' + i" v-model="questionForm.options[i]" type="text">
            </div>
            <label>
              <input type="radio" :value="i" v-model.number="questionForm.correct_option_index">
              Correct
            </label>
          </div>

          <div class="auth-field">
            <label for="q-order">Order</label>
            <input id="q-order" v-model.number="questionForm.order_index" type="number" min="0">
          </div>

          <button class="auth-submit" type="submit" :disabled="questionBusy">
            {{ questionBusy ? 'Saving...' : (isEditingQuestion ? 'Save changes' : 'Add question') }}
          </button>

          <button v-if="isEditingQuestion" class="admin-cancel" type="button" @click="cancelEditQuestion">
            Cancel
          </button>
        </form>
      </template>
    </section>

  </main>
</template>

<script>
import Admin from './Admin.js'
export default Admin
</script>
