import { buildItineraryPrompt } from './itineraryPrompt.js'
import { allocateBudget } from '../src/utils/budget.js'

const MAX_DAYS = 10
const PACES = new Set(['relaxed', 'balanced', 'active'])
const INTERESTS = new Set(['History', 'Food', 'Nature', 'Culture', 'Shopping', 'Religious sites'])
const INTERCITY_MODES = new Set(['auto', 'train', 'bus', 'flight', 'car'])
const LOCAL_MODES = new Set(['auto', 'walking', 'public-transit', 'taxi', 'private-car'])
const TRANSPORT_PRIORITIES = new Set(['balanced', 'value', 'luxury', 'relaxed'])
const DEPARTURE_PERIODS = new Set(['flexible', 'early', 'morning', 'afternoon', 'evening'])

export function validateTripRequest(body = {}) {
  const source = typeof body.source === 'string' ? body.source.trim() : ''
  const destination = typeof body.destination === 'string' ? body.destination.trim() : ''
  const days = Number(body.days)
  const people = Number(body.people ?? 1)
  if (!source || !destination)
    return { ok: false, error: 'Enter both a starting city and a destination.' }
  if (source.length > 80 || destination.length > 80)
    return { ok: false, error: 'City names must be 80 characters or fewer.' }
  if (source.toLowerCase() === destination.toLowerCase())
    return { ok: false, error: 'Choose two different cities for your trip.' }
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS)
    return { ok: false, error: 'Choose a trip length between 1 and 10 days.' }
  if (!Number.isInteger(people) || people < 1 || people > 12)
    return { ok: false, error: 'Choose between 1 and 12 travelers.' }
  const startDate = body.startDate == null || body.startDate === '' ? null : String(body.startDate)
  if (startDate) {
    const parsedDate = new Date(`${startDate}T00:00:00Z`)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== startDate
    ) {
      return { ok: false, error: 'Choose a valid trip start date.' }
    }
  }
  const rawPreferences =
    body.preferences && typeof body.preferences === 'object' && !Array.isArray(body.preferences)
      ? body.preferences
      : {}
  const pace = PACES.has(rawPreferences.pace) ? rawPreferences.pace : 'balanced'
  const interests = Array.isArray(rawPreferences.interests)
    ? [...new Set(rawPreferences.interests.filter((item) => INTERESTS.has(item)))].slice(0, 6)
    : []
  const familyFriendly = rawPreferences.familyFriendly === true
  const intercityTransport = INTERCITY_MODES.has(rawPreferences.intercityTransport)
    ? rawPreferences.intercityTransport
    : 'auto'
  const localTransport = LOCAL_MODES.has(rawPreferences.localTransport)
    ? rawPreferences.localTransport
    : 'auto'
  const transportPriority = TRANSPORT_PRIORITIES.has(rawPreferences.transportPriority)
    ? rawPreferences.transportPriority
    : 'balanced'
  const departurePeriod = DEPARTURE_PERIODS.has(rawPreferences.departurePeriod)
    ? rawPreferences.departurePeriod
    : 'flexible'
  const arrivalPeriod = DEPARTURE_PERIODS.has(rawPreferences.arrivalPeriod)
    ? rawPreferences.arrivalPeriod
    : 'flexible'
  const hasPreferences =
    pace !== 'balanced' ||
    interests.length > 0 ||
    familyFriendly ||
    intercityTransport !== 'auto' ||
    localTransport !== 'auto' ||
    transportPriority !== 'balanced' ||
    departurePeriod !== 'flexible' ||
    arrivalPeriod !== 'flexible'
  const preferences = hasPreferences
    ? {
        pace,
        interests,
        familyFriendly,
        intercityTransport,
        localTransport,
        transportPriority,
        departurePeriod,
        arrivalPeriod,
      }
    : null
  let budget = null
  if (body.budget != null) {
    const amount = Number(body.budget.amount)
    const currency =
      typeof body.budget.currency === 'string' ? body.budget.currency.toUpperCase() : 'INR'
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000)
      return { ok: false, error: 'Budget must be a positive amount under 100,000,000.' }
    if (currency !== 'INR')
      return { ok: false, error: 'Trip budgets currently use Indian rupees (INR).' }
    budget = { amount: Math.round(amount * 100) / 100, currency }
  }
  const value = { source, destination, days, people, budget }
  if (startDate) value.startDate = startDate
  if (preferences) value.preferences = preferences
  return { ok: true, value }
}

function extractText(payload) {
  return payload?.choices?.[0]?.message?.content?.trim() || ''
}

function providerError(status) {
  if (status === 429)
    return Object.assign(
      new Error('Groq is at its current request limit. Wait a little and try again.'),
      { status: 429, code: 'RATE_LIMITED' },
    )
  if ([400, 401, 403, 404].includes(status))
    return Object.assign(
      new Error('Groq rejected the request. Check the GROQ_API_KEY and GROQ_MODEL settings.'),
      { status: 502, code: 'PROVIDER_CONFIG' },
    )
  return Object.assign(
    new Error('Groq could not create this itinerary just now. Please try again.'),
    { status: 502, code: 'GENERATION_FAILED' },
  )
}

function completionTokenLimit(days, preferences) {
  const stopsPerDay = { relaxed: 3, balanced: 4, active: 6 }[preferences?.pace] || 4
  return Math.min(6_000, Math.max(1_800, 750 + days * stopsPerDay * 115))
}

export async function makeItinerary({
  source,
  destination,
  days,
  people = 1,
  budget = null,
  preferences = null,
  startDate = null,
  apiKey,
  model = 'qwen/qwen3.8-27b',
  timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 60_000,
}) {
  const prompt = buildItineraryPrompt({
    source,
    destination,
    days,
    people,
    budget,
    preferences,
    startDate,
  })
  const url = 'https://api.groq.com/openai/v1/chat/completions'
  const requestBody = {
    model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_completion_tokens: completionTokenLimit(days, preferences),
    reasoning_effort: 'none',
    temperature: 0.7,
  }
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(Math.min(Math.max(timeoutMs, 10_000), 120_000)),
    })
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError')
      throw Object.assign(new Error('Groq took too long to respond. Try again in a moment.'), {
        status: 504,
        code: 'TIMEOUT',
      })
    throw Object.assign(new Error('Could not reach Groq. Check your connection and try again.'), {
      status: 502,
      code: 'UPSTREAM_UNAVAILABLE',
    })
  }

  if (!response.ok) throw providerError(response.status)

  let payload
  try {
    payload = await response.json()
  } catch {
    throw Object.assign(new Error('Groq returned an unreadable response. Please try again.'), {
      status: 502,
      code: 'INVALID_RESPONSE',
    })
  }
  const text = extractText(payload)
  try {
    const result = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''))
    if (
      !Array.isArray(result.days) ||
      result.days.length !== days ||
      !result.days.every(
        (item) =>
          Array.isArray(item.activities) &&
          item.activities.length >= 1 &&
          item.activities.length <= 7,
      )
    )
      throw new Error('missing itinerary days')
    return {
      ...result,
      ...(budget
        ? {
            budgetAllocation: allocateBudget(budget, people, result.budgetAllocation?.categories, {
              destination,
              preferences,
              days,
            }),
          }
        : {}),
    }
  } catch {
    throw Object.assign(
      new Error('Groq returned an itinerary in an unexpected format. Please try again.'),
      { status: 502, code: 'INVALID_RESPONSE' },
    )
  }
}
