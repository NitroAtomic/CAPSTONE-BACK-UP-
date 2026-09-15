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

        <router-link to="/login" class="btn btn-login">Log in</router-link>
        <router-link to="/premium-subscription" class="btn btn-premium">Go Premium</router-link>
      </div>

    </nav>
  </header>
</template>

<script src="./SiteHeader.js"></script>
