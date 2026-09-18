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
              <button type="button" class="admin-delete" @click="remove(mod)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

  </main>
</template>

<script>
import Admin from './Admin.js'
export default Admin
</script>
