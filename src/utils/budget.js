import { BUDGET_CATEGORY_NAMES } from '../constants/trip.js'

const HIGH_COST_CITIES = new Set([
  'bengaluru',
  'bangalore',
  'delhi',
  'new delhi',
  'goa',
  'hyderabad',
  'leh',
  'manali',
  'mumbai',
  'ooty',
  'pune',
  'shimla',
  'srinagar',
  'udaipur',
])

const VALUE_CITIES = new Set([
  'amritsar',
  'bhopal',
  'indore',
  'jaipur',
  'jodhpur',
  'kolkata',
  'lucknow',
  'madurai',
  'mysuru',
  'mysore',
  'pushkar',
  'rishikesh',
  'varanasi',
])

const CATEGORY_ALIASES = Object.freeze({
  travel: 'Travel',
  transport: 'Travel',
  transportation: 'Travel',
  transit: 'Travel',
  stay: 'Stay',
  accommodation: 'Stay',
  lodging: 'Stay',
  hotel: 'Stay',
  hotels: 'Stay',
  food: 'Food',
  dining: 'Food',
  meals: 'Food',
  restaurants: 'Food',
  shopping: 'Shopping',
  souvenirs: 'Shopping',
  activities: 'Activities',
  activity: 'Activities',
  attractions: 'Activities',
  sightseeing: 'Activities',
  experiences: 'Activities',
})

function normalizeCategory(name) {
  const normalized = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')
  return CATEGORY_ALIASES[normalized] || null
}

function cityCostFactors(destination = '') {
  const name = destination.split(',')[0].trim().toLocaleLowerCase()
  if (HIGH_COST_CITIES.has(name))
    return { Travel: 1.05, Stay: 1.3, Food: 1.2, Shopping: 1.08, Activities: 1.08 }
  if (VALUE_CITIES.has(name))
    return { Travel: 0.95, Stay: 0.88, Food: 0.9, Shopping: 0.92, Activities: 0.88 }
  return { Travel: 1, Stay: 1, Food: 1, Shopping: 1, Activities: 1 }
}

function preferenceFactors(preferences = {}) {
  preferences ||= {}
  const factors = { Travel: 1, Stay: 1, Food: 1, Shopping: 1, Activities: 1 }
  const priority = preferences.transportPriority || 'balanced'
  const priorityFactors = {
    value: { Travel: 0.82, Stay: 0.88, Food: 0.92, Shopping: 0.82, Activities: 0.9 },
    luxury: { Travel: 1.18, Stay: 1.32, Food: 1.18, Shopping: 1.12, Activities: 1.15 },
    relaxed: { Travel: 1.1, Stay: 1.12, Food: 1.05, Shopping: 0.95, Activities: 0.9 },
  }[priority]
  if (priorityFactors) {
    for (const category of BUDGET_CATEGORY_NAMES) factors[category] *= priorityFactors[category]
  }

  const intercityFactors = { flight: 1.4, train: 1.05, bus: 0.85, car: 1.12 }
  const localFactors = { walking: 0.78, 'public-transit': 0.88, taxi: 1.08, 'private-car': 1.22 }
  factors.Travel *= intercityFactors[preferences.intercityTransport] || 1
  factors.Travel *= localFactors[preferences.localTransport] || 1

  const interests = new Set(preferences.interests || [])
  if (interests.has('Food')) factors.Food *= 1.35
  if (interests.has('Shopping')) factors.Shopping *= 1.55
  if (
    ['History', 'Culture', 'Religious sites', 'Nature'].some((interest) => interests.has(interest))
  )
    factors.Activities *= 1.3
  if (preferences.familyFriendly) {
    factors.Travel *= 1.08
    factors.Activities *= 1.12
  }
  return factors
}

function estimatedShares(days) {
  const base = { Travel: 1.15, Stay: 1.65, Food: 1.2, Shopping: 0.55, Activities: 1.05 }
  if (days <= 2) base.Travel *= 1.12
  if (days >= 6) base.Stay *= 1.12
  return BUDGET_CATEGORY_NAMES.map((category) => ({
    category,
    percent: base[category],
  }))
}

function readModelShares(proposedCategories, budgetAmount) {
  const source = Array.isArray(proposedCategories)
    ? proposedCategories
    : proposedCategories && typeof proposedCategories === 'object'
      ? Object.entries(proposedCategories).map(([category, value]) =>
          typeof value === 'object' ? { category, ...value } : { category, percent: value },
        )
      : []
  const shares = new Map()
  for (const item of source) {
    const category = normalizeCategory(item?.category || item?.name)
    const value = item?.percent ?? item?.share ?? item?.amount
    const percent = Number(String(value ?? '').replace('%', ''))
    const normalizedPercent =
      item?.amount != null && item?.percent == null && budgetAmount
        ? (percent / budgetAmount) * 100
        : percent
    if (category && Number.isFinite(normalizedPercent) && normalizedPercent > 0) {
      shares.set(category, (shares.get(category) || 0) + normalizedPercent)
    }
  }
  return BUDGET_CATEGORY_NAMES.filter((category) => shares.has(category)).map((category) => ({
    category,
    percent: shares.get(category),
  }))
}

export function allocateBudget(budget, people = 1, proposedCategories = [], context = {}) {
  if (!budget) return null
  const proposedShares = readModelShares(proposedCategories, budget.amount)
  const fallbackShares = estimatedShares(context.days || 1)
  let shares = fallbackShares
  let estimated = true
  if (proposedShares.length) {
    const proposedTotal = proposedShares.reduce((sum, item) => sum + item.percent, 0)
    const proposedAverage = proposedTotal / proposedShares.length
    const fallbackAverage = fallbackShares.reduce((sum, item) => sum + item.percent, 0) / 5
    const proposedMap = new Map(proposedShares.map((item) => [item.category, item.percent]))
    shares = BUDGET_CATEGORY_NAMES.map((category) => ({
      category,
      percent:
        proposedMap.get(category) ??
        proposedAverage *
          (fallbackShares.find((item) => item.category === category).percent / fallbackAverage),
    }))
    estimated = proposedShares.length < BUDGET_CATEGORY_NAMES.length
  }
  const factors = preferenceFactors(context.preferences)
  const cityFactors = cityCostFactors(context.destination)
  const weightedShares = shares.map(({ category, percent }) => ({
    category,
    weight: percent * factors[category] * cityFactors[category],
  }))
  const shareTotal = weightedShares.reduce((sum, item) => sum + item.weight, 0)
  const totalMinor = Math.round(budget.amount * 100)
  const allocations = weightedShares.map(({ category, weight }) => {
    const exactMinor = (totalMinor * weight) / shareTotal
    return {
      category,
      percent: (weight * 100) / shareTotal,
      minor: Math.floor(exactMinor),
      remainder: exactMinor % 1,
    }
  })
  const remainingMinor = totalMinor - allocations.reduce((sum, item) => sum + item.minor, 0)
  allocations
    .slice()
    .sort((left, right) => right.remainder - left.remainder)
    .slice(0, remainingMinor)
    .forEach((item) => {
      item.minor += 1
    })

  const categories = allocations.map(({ category, percent, minor }) => ({
    category,
    percent: Number(percent.toFixed(1)),
    amount: minor / 100,
  }))
  return {
    total: totalMinor / 100,
    people,
    currency: budget.currency,
    categories,
    estimated,
  }
}
