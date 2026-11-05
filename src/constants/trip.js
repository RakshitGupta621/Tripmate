export const BUDGET_RANGE = Object.freeze({ min: 5_000, max: 500_000, step: 5_000 })
export const SESSION_RESULT_KEY = 'tripmate-session-result-personalized-v4'
export const SESSION_RESULT_TTL = 5 * 60 * 1000

export const INITIAL_FORM = Object.freeze({
  source: '',
  destination: '',
  days: 1,
  people: 1,
  budget: 30_000,
  includeBudget: true,
  startDate: '',
  endDate: '',
  travelStyle: 'balanced',
  interests: [],
  familyFriendly: false,
  intercityTransport: 'auto',
  localTransport: 'auto',
  departurePeriod: 'flexible',
  arrivalPeriod: 'flexible',
  directionsMode: 'pedestrian',
})

export const TRAVEL_STYLES = Object.freeze({
  balanced: { pace: 'balanced', transportPriority: 'balanced' },
  relaxed: { pace: 'relaxed', transportPriority: 'relaxed' },
  active: { pace: 'active', transportPriority: 'balanced' },
  value: { pace: 'balanced', transportPriority: 'value' },
  luxury: { pace: 'relaxed', transportPriority: 'luxury' },
})

export const BUDGET_CATEGORY_NAMES = Object.freeze([
  'Travel',
  'Stay',
  'Food',
  'Shopping',
  'Activities',
])
