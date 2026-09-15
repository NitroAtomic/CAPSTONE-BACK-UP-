import { createRouter, createWebHistory } from 'vue-router'

// Import page components
import Home from './pages/Home.vue'
import About from './pages/About.vue'
import Login from './pages/Login.vue'
import ForgotPassword from './pages/ForgotPassword.vue'
import ForgotPasswordConfirmation from './pages/ForgotPasswordConfirmation.vue'
import PremiumSubscription from './pages/PremiumSubscription.vue'
import CreateAccount from './pages/CreateAccount.vue'
import Payment from './pages/Payment.vue'
import Dashboard from './pages/Dashboard.vue'

// Import module components
import Quishing from './modules/Quishing.vue'
import SpearPhishing from './modules/SpearPhishing.vue'
import Smishing from './modules/Smishing.vue'
import Vishing from './modules/Vishing.vue'
import Pretexting from './modules/Pretexting.vue'
import EssentialSafePracticesRemoteEnv from './modules/EssentialSafePracticesRemoteEnv.vue'

// Import quiz components
import QuizQuestion from './quiz/QuizQuestion.vue'
import QuizResults from './quiz/QuizResults.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword
  },
  {
    path: '/forgot-password-confirmation',
    name: 'ForgotPasswordConfirmation',
    component: ForgotPasswordConfirmation
  },
  {
    path: '/premium-subscription',
    name: 'PremiumSubscription',
    component: PremiumSubscription
  },
  {
    path: '/create-account',
    name: 'CreateAccount',
    component: CreateAccount
  },
  {
    path: '/payment',
    name: 'Payment',
    component: Payment
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  // Module routes
  {
    path: '/modules/quishing',
    name: 'Quishing',
    component: Quishing
  },
  {
    path: '/modules/spear-phishing',
    name: 'SpearPhishing',
    component: SpearPhishing
  },
  {
    path: '/modules/smishing',
    name: 'Smishing',
    component: Smishing
  },
  {
    path: '/modules/vishing',
    name: 'Vishing',
    component: Vishing
  },
  {
    path: '/modules/pretexting',
    name: 'Pretexting',
    component: Pretexting
  },
  {
    path: '/modules/essential-safe-practices-remote-environments',
    name: 'EssentialSafePracticesRemoteEnv',
    component: EssentialSafePracticesRemoteEnv
  },
  // Quiz routes
  {
    path: '/quiz/:moduleId/question',
    name: 'QuizQuestion',
    component: QuizQuestion
  },
  {
    path: '/quiz/:moduleId/results',
    name: 'QuizResults',
    component: QuizResults
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
