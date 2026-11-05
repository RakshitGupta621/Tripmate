import { TRAVEL_STYLES } from '../constants/trip.js'
import appContent from '../appContent.json'
import { PREFERENCE_LABEL_TEXT, fillText } from './util_constants.js'

export function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

export function formatLocalDate(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export function addDaysToDate(date, count) {
  if (!date) return ''
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + count)
  return value.toISOString().slice(0, 10)
}

export function daysBetweenDates(start, end) {
  return (
    Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1
  )
}

export function getPreferenceLabels(form = {}) {
  const labels = []
  if (form.travelStyle && form.travelStyle !== 'balanced')
    labels.push(
      appContent.preferences.travelStyleLabels[form.travelStyle] ||
        PREFERENCE_LABEL_TEXT.personalizedPace,
    )
  for (const interest of form.interests || []) labels.push(interest)
  if (form.familyFriendly) labels.push(PREFERENCE_LABEL_TEXT.familyFriendly)
  const intercityLabel = appContent.preferences.intercityModes.find(
    (item) => item.value === form.intercityTransport,
  )?.label
  const localLabel = appContent.preferences.localModes.find(
    (item) => item.value === form.localTransport,
  )?.label
  if (intercityLabel && form.intercityTransport !== 'auto')
    labels.push(fillText(PREFERENCE_LABEL_TEXT.toCity, { label: intercityLabel }))
  if (localLabel && form.localTransport !== 'auto')
    labels.push(fillText(PREFERENCE_LABEL_TEXT.aroundCity, { label: localLabel }))
  return labels
}

export function getItineraryPreferences(form = {}) {
  const style = TRAVEL_STYLES[form.travelStyle] || TRAVEL_STYLES.balanced
  const preferences = {
    ...style,
    interests: Array.isArray(form.interests) ? form.interests : [],
    familyFriendly: form.familyFriendly === true,
    intercityTransport: form.intercityTransport || 'auto',
    localTransport: form.localTransport || 'auto',
    departurePeriod: form.departurePeriod || 'flexible',
    arrivalPeriod: form.arrivalPeriod || 'flexible',
  }
  const hasPersonalChoices =
    form.travelStyle !== 'balanced' ||
    preferences.interests.length > 0 ||
    preferences.familyFriendly ||
    preferences.intercityTransport !== 'auto' ||
    preferences.localTransport !== 'auto' ||
    preferences.departurePeriod !== 'flexible' ||
    preferences.arrivalPeriod !== 'flexible'
  return hasPersonalChoices ? preferences : null
}
