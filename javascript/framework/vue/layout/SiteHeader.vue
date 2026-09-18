<template>
  <header class="site-header">
    <nav class="navbar">

      <div class="nav-left">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/about" class="nav-link">About</router-link>
      </div>

      <div class="nav-right">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search"
            aria-label="Search modules"
            @keyup.enter="goToFirstResult"
          >
          <div v-if="searchQuery.trim()" class="search-results">
            <router-link
              v-for="result in searchResults"
              :key="result.id"
              :to="result.link"
              class="search-result-item"
              @click="clearSearch"
            >
              {{ result.title }}
            </router-link>
            <p v-if="searchResults.length === 0" class="search-no-results">
              No matching modules
            </p>
          </div>
        </div>

        <template v-if="user">
          <router-link v-if="isPremium" to="/assessment" class="nav-link">Assessment</router-link>
          <router-link v-if="isPremium" to="/premium-modules" class="nav-link">Role-based</router-link>
          <router-link v-if="isAdmin" to="/admin" class="nav-link">Admin</router-link>
          <router-link to="/dashboard" class="btn btn-login">{{ user.first_name }}</router-link>
          <router-link v-if="!isPremium" to="/premium-subscription" class="btn btn-premium">Go Premium</router-link>
          <span v-else class="btn btn-premium-active">Premium</span>
          <button type="button" class="btn btn-logout" @click="signOut">Log out</button>
        </template>

        <template v-else>
          <router-link to="/login" class="btn btn-login">Log in</router-link>
          <router-link to="/premium-subscription" class="btn btn-premium">Go Premium</router-link>
        </template>
      </div>

    </nav>
  </header>
</template>

<script src="./SiteHeader.js"></script>
