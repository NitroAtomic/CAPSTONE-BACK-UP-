// Backend and integration: IamAtomic
// auth.js
//
// Single place where the frontend talks to the backend API.
// Every page that needs an account goes through here, so the token handling
// and error shapes stay consistent rather than being repeated per page.
//
// Backend: backend-node/ (Node.js + Express + MySQL)
// Start it with `npm start` inside backend-node before using these.

const TOKEN_KEY = 'se-auth-token'
const USER_KEY = 'se-auth-user'

// Where the API lives.
//
// In development the Vite dev server runs on 5173 and the API on 3000, so the
// full origin is needed. In production the backend serves this built app from
// its own origin, so an empty base keeps every request same origin and avoids
// CORS entirely. VITE_API_BASE overrides both if the two are ever split across
// separate hosts.
const API_BASE = import.meta.env.VITE_API_BASE
  ?? (import.meta.env.PROD ? '' : 'http://localhost:3000')

/* ---------------- session storage ----------------
   sessionStorage rather than localStorage: the session ends when the tab
   closes, which suits remote workers who may be on a shared machine. */

function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function setSession(token, user) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)

    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(USER_KEY)
  } catch {
    // storage unavailable; nothing useful to do here
  }
}

function getUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/* ---------------- request helper ---------------- */

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(API_BASE + path, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    // An expired or invalid token should not leave the interface pretending
    // the user is still signed in.
    if (response.status === 401 && getToken()) setSession(null, null)
    throw new Error(data.error || 'Something went wrong. Please try again.')
  }

  return data
}

/* ---------------- public API ---------------- */

export default {
  getUser,
  getToken,

  isSignedIn() {
    return !!getToken()
  },

  isPremium() {
    const user = getUser()
    return !!(user && user.subscription_type === 'Premium' && user.subscription_status === 'active')
  },

  isAdmin() {
    const user = getUser()
    return !!(user && user.role === 'admin')
  },

  /* ----- account creation ----- */
  async register({ firstName, lastName, email, password }) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: { first_name: firstName, last_name: lastName, email, password }
    })
    setSession(data.token, data.user)
    return data.user
  },

  /* ----- login -----
     Premium accounts get a second step: the response carries requiresOtp and
     a short-lived pendingToken instead of a session token. The caller then
     collects the emailed code and calls verifyOtp. */
  async login({ email, password }) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })

    if (data.requiresOtp) {
      return { requiresOtp: true, pendingToken: data.pendingToken, email: data.email }
    }

    setSession(data.token, data.user)
    return { requiresOtp: false, user: data.user }
  },

  async verifyOtp({ pendingToken, code }) {
    const data = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: { pendingToken, code }
    })
    setSession(data.token, data.user)
    return data.user
  },

  async resendOtp(pendingToken) {
    return request('/api/auth/resend-otp', { method: 'POST', body: { pendingToken } })
  },

  /* ----- logout ----- */
  async logout() {
    try {
      if (getToken()) await request('/api/auth/logout', { method: 'POST' })
    } catch {
      // Clearing locally matters more than the server acknowledging it.
    }
    setSession(null, null)
  },

  /* ----- password reset ----- */
  async forgotPassword(email) {
    return request('/api/auth/forgot-password', { method: 'POST', body: { email } })
  },

  async resetPassword({ email, code, newPassword }) {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: { email, code, newPassword }
    })
  },

  /* ----- account and plan ----- */
  async refreshUser() {
    const user = await request('/api/auth/me')
    setSession(getToken(), user)
    return user
  },

  /** FR-10: records the plan on the account. No payment is taken; payment
   *  processing is outside the study's scope. */
  async changePlan(subscriptionType) {
    await request('/api/auth/me/subscription', {
      method: 'PATCH',
      body: { subscription_type: subscriptionType }
    })
    return this.refreshUser()
  },

  /* ----- dashboard ----- */
  async getDashboard() {
    return request('/api/dashboard')
  },

  async getRecommendations() {
    return request('/api/dashboard/recommendations')
  },


  /* ----- assessment ----- */
  async submitAssessment(result) {
    return request('/api/assessment/submit', { method: 'POST', body: result })
  },

  async getLatestAssessment() {
    return request('/api/assessment/latest')
  },

  /* ----- modules ----- */
  async getModules() {
    return request('/api/modules')
  },

  /** Public teaser list of Premium modules (title/summary/category), visible
   *  whether or not the caller is signed in or Premium. */
  async getPremiumModulesList() {
    return request('/api/modules/premium-list')
  },

  /** Full module record, gated server-side the same way the page itself is. */
  async getModule(slug) {
    return request(`/api/modules/${slug}`)
  },

  /* ----- admin -----
     Every one of these is refused by the server unless the account's role is
     admin, so the interface hiding them is a convenience rather than the
     actual control. */
  async adminCreateModule(payload) {
    return request('/api/modules', { method: 'POST', body: payload })
  },

  async adminUpdateModule(id, payload) {
    return request(`/api/modules/${id}`, { method: 'PUT', body: payload })
  },

  async adminDeleteModule(id) {
    return request(`/api/modules/${id}`, { method: 'DELETE' })
  },

  /* ----- admin: quiz questions ----- */
  async getQuizByModule(slug) {
    return request(`/api/quizzes/by-module/${slug}`)
  },

  async adminGetQuizQuestions(quizId) {
    return request(`/api/quizzes/${quizId}/questions`)
  },

  async adminAddQuestion(quizId, payload) {
    return request(`/api/quizzes/${quizId}/questions`, { method: 'POST', body: payload })
  },

  async adminUpdateQuestion(questionId, payload) {
    return request(`/api/quizzes/questions/${questionId}`, { method: 'PUT', body: payload })
  },

  async adminDeleteQuestion(questionId) {
    return request(`/api/quizzes/questions/${questionId}`, { method: 'DELETE' })
  },

  /* ----- learning assistant ----- */
  async sendChatMessage(message) {
    const data = await request('/api/chat', { method: 'POST', body: { message } })
    return data.reply
  },

  /* ----- quiz results -----
     Lets a completed quiz appear in the user's history and mark the module
     as done, rather than the score living only in the browser. */
  async recordQuizAttempt({ slug, score, total }) {
    return request('/api/quizzes/record-attempt', {
      method: 'POST',
      body: { slug, score, total }
    })
  }
}
