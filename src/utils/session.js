import { INITIAL_FORM, SESSION_RESULT_KEY } from '../constants/trip.js'
import { hasSharedItineraryHash } from './shareItinerary.js'

export function readSessionResult() {
  try {
    if (hasSharedItineraryHash()) return null
    const cached = JSON.parse(sessionStorage.getItem(SESSION_RESULT_KEY) || 'null')
    if (!cached?.expiresAt || cached.expiresAt <= Date.now() || !cached.trip) {
      sessionStorage.removeItem(SESSION_RESULT_KEY)
      return null
    }
    const restoreForm = (savedForm) => {
      const restored = { ...INITIAL_FORM, ...(savedForm || {}) }
      if (!savedForm?.travelStyle)
        restored.travelStyle =
          savedForm?.transportPriority === 'value'
            ? 'value'
            : savedForm?.transportPriority === 'luxury'
              ? 'luxury'
              : savedForm?.pace === 'relaxed'
                ? 'relaxed'
                : savedForm?.pace === 'active'
                  ? 'active'
                  : 'balanced'
      return restored
    }
    cached.form = restoreForm(cached.form)
    cached.tripForm = restoreForm(cached.tripForm || cached.form)
    if (cached.wiki)
      cached.wiki = { title: cached.wiki.title, extract: cached.wiki.extract, url: cached.wiki.url }
    delete cached.cityImage
    delete cached.weatherForecast
    return cached
  } catch {
    return null
  }
}
