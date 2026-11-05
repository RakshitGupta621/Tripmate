// Shared copy used by multiple UI and service modules.
export const SERVICE_MESSAGES = Object.freeze({
  citySearchUnavailable: 'City search is temporarily unavailable. You can still enter a city.',
  citySearchTimeout: 'City search took too long. Check your connection and try again.',
  citySuggestionsUnavailable: 'City suggestions are temporarily unavailable.',
  locationLookupFailed: 'Could not turn your location into a city.',
  locationCityNotFound: 'Could not identify a city for your location.',
  encyclopediaUnavailable: 'No encyclopedia summary found.',
  itineraryUnavailable: 'We could not create this itinerary. Please try again.',
  datesRequired: 'Choose your departure and return dates to set the trip length.',
  sharedLinkInvalid: 'This itinerary link is invalid or incomplete. Ask for a fresh link.',
})

export const PREFERENCE_LABEL_TEXT = Object.freeze({
  personalizedPace: 'Personalized pace',
  familyFriendly: 'Family-friendly',
  toCity: 'To city · {label}',
  aroundCity: 'Around city · {label}',
})

export function fillText(template, values = {}) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  )
}
