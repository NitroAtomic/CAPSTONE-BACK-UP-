// Backend and integration: IamAtomic
import auth from '../services/auth.js'

// Agreed pricing. Kept here so a change is one edit rather than three.
export const PLANS = {
  monthly: { key: 'monthly', label: 'Monthly', amount: '\u20B1149',   period: '/month', billing: 'Billed monthly, cancel anytime' },
  yearly:  { key: 'yearly',  label: 'Yearly',  amount: '\u20B11,199', period: '/year',  billing: 'Billed yearly, cancel anytime' }
}

const STORAGE_KEY = 'se-selected-plan'

export function getSelectedPlan() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored && PLANS[stored]) return PLANS[stored]
  } catch { /* storage unavailable */ }
  return PLANS.monthly
}

export function setSelectedPlan(key) {
  if (!PLANS[key]) return PLANS.monthly
  try { sessionStorage.setItem(STORAGE_KEY, key) } catch { /* no-op */ }
  return PLANS[key]
}

export function clearSelectedPlan() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* no-op */ }
}

export default {
  name: 'PremiumSubscription',

  data() {
    return {
      selected: getSelectedPlan().key,
      isSignedIn: auth.isSignedIn(),
      isPremium: auth.isPremium()
    }
  },

  computed: {
    plan() {
      return PLANS[this.selected]
    },

    // The page advertises three steps: choose plan, create account, pay.
    // Step two only applies to people without an account, so the button
    // has to branch rather than always pointing at registration.
    continueTo() {
      if (this.isPremium) return '/dashboard'
      if (this.isSignedIn) return '/payment'
      return '/create-account?next=payment'
    },

    continueLabel() {
      return this.isPremium ? 'Go to your dashboard' : 'Continue'
    },

    accountNote() {
      if (this.isPremium) return 'You are already on the Premium plan.'
      if (this.isSignedIn) return 'You are signed in, so the next step is payment.'
      return 'You will create your account in the next step'
    }
  },

  methods: {
    choose(key) {
      this.selected = setSelectedPlan(key).key
    }
  }
}
