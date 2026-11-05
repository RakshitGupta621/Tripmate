import { SERVICE_MESSAGES } from '../utils/util_constants.js'

const geoCache = new Map()
const reverseGeoCache = new Map()
const suggestionCache = new Map()
const itineraryPlaceCache = new Map()
const wikipediaCache = new Map()
const itineraryCache = new Map()
const itineraryRequests = new Map()
const ITINERARY_SESSION_CACHE_KEY = 'tripmate-itinerary-cache-v1'
const ITINERARY_CACHE_TTL = 30 * 60 * 1000
const deadline = (signal, ms) =>
  signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms)
let geocodeQueue = Promise.resolve()
let lastGeocodeAt = 0

function wait(ms, signal) {
  if (signal?.aborted) return Promise.reject(signal.reason)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export async function geocodeCity(city, signal) {
  const key = city.trim().toLowerCase()
  if (geoCache.has(key)) return geoCache.get(key)
  const request = geocodeQueue.then(async () => {
    if (geoCache.has(key)) return geoCache.get(key)
    const delay = Math.max(0, 1_050 - (Date.now() - lastGeocodeAt))
    if (delay) await wait(delay, signal)
    signal?.throwIfAborted()
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.search = new URLSearchParams({ q: city, format: 'jsonv2', limit: '1', addressdetails: '1' })
    let response
    try {
      response = await fetch(url, {
        signal: deadline(signal, 10_000),
        headers: { 'Accept-Language': 'en' },
      })
    } catch (error) {
      if (error.name === 'TimeoutError') throw new Error(SERVICE_MESSAGES.citySearchTimeout)
      throw error
    } finally {
      lastGeocodeAt = Date.now()
    }
    if (!response.ok) throw new Error(SERVICE_MESSAGES.citySearchUnavailable)
    const results = await response.json()
    const place = results[0]
    if (!place) throw new Error(`We couldn't find “${city}”. Try a city name with its country.`)
    const result = {
      lat: Number(place.lat),
      lon: Number(place.lon),
      label: place.display_name,
      name: place.name || city,
    }
    geoCache.set(key, result)
    return result
  })
  geocodeQueue = request.catch(() => {})
  return request
}

// Reverse lookup runs only after the browser grants location access and is cached by area.
export async function reverseGeocodeCity(latitude, longitude, signal) {
  const cacheKey = `${Number(latitude).toFixed(3)},${Number(longitude).toFixed(3)}`
  if (reverseGeoCache.has(cacheKey)) return reverseGeoCache.get(cacheKey)

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.search = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '10',
  })
  const response = await fetch(url, {
    signal: deadline(signal, 8_000),
    headers: { 'Accept-Language': 'en' },
  })
  if (!response.ok) throw new Error(SERVICE_MESSAGES.locationLookupFailed)

  const result = await response.json()
  const address = result.address || {}
  const name =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.hamlet ||
    address.county
  if (!name) throw new Error(SERVICE_MESSAGES.locationCityNotFound)

  const parts = [name, address.state, address.country].filter(
    (part, index, all) => part && all.indexOf(part) === index,
  )
  const query = parts.join(', ')
  const city = {
    name,
    query,
    label: query,
    lat: Number(latitude),
    lon: Number(longitude),
  }
  reverseGeoCache.set(cacheKey, city)
  if (reverseGeoCache.size > 100) reverseGeoCache.delete(reverseGeoCache.keys().next().value)
  return city
}

export async function suggestCities(query, signal) {
  const key = query.trim().toLocaleLowerCase()
  if (key.length < 2) return []
  if (suggestionCache.has(key)) return suggestionCache.get(key)
  const url = new URL('https://photon.komoot.io/api/')
  url.search = new URLSearchParams({ q: query.trim(), limit: '10', lang: 'en' })
  const response = await fetch(url, {
    signal: deadline(signal, 8_000),
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(SERVICE_MESSAGES.citySuggestionsUnavailable)
  const data = await response.json()
  const seen = new Set()
  const cities = (data.features || []).flatMap((feature) => {
    const props = feature.properties || {}
    if (props.osm_key !== 'place' || !['city', 'town', 'village'].includes(props.osm_value))
      return []
    const name = props.name || props.city
    if (!name) return []
    const parts = [name, props.state, props.country].filter(
      (part, index, all) => part && all.indexOf(part) === index,
    )
    const label = parts.join(', ')
    const identity = label.toLocaleLowerCase()
    if (seen.has(identity)) return []
    seen.add(identity)
    return [
      {
        name,
        label,
        query: label,
        lat: feature.geometry?.coordinates?.[1],
        lon: feature.geometry?.coordinates?.[0],
        country: props.country,
      },
    ]
  })
  const results = cities.slice(0, 6)
  suggestionCache.set(key, results)
  if (suggestionCache.size > 100) suggestionCache.delete(suggestionCache.keys().next().value)
  return results
}

function distanceKm(a, b) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const lat1 = radians(a.lat)
  const lat2 = radians(b.lat)
  const deltaLat = radians(b.lat - a.lat)
  const deltaLon = radians(b.lon - a.lon)
  const haversine =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export async function geocodeItineraryPlaces(activities, destination, signal) {
  if (!destination || !Array.isArray(activities)) return []
  const unique = new Map()
  for (const activity of activities) {
    const title = typeof activity.title === 'string' ? activity.title.trim() : ''
    const key = title.toLocaleLowerCase()
    if (title && key.length > 2 && !unique.has(key)) unique.set(key, activity)
    if (unique.size >= 8) break
  }

  const pins = []
  for (const [key, activity] of unique) {
    signal?.throwIfAborted()
    const cacheKey = `${destination.name || destination.label}:${key}`.toLocaleLowerCase()
    let place = itineraryPlaceCache.get(cacheKey)
    if (place === undefined) {
      const url = new URL('https://photon.komoot.io/api/')
      url.search = new URLSearchParams({
        q: `${activity.title}, ${destination.name || destination.label}`,
        limit: '1',
        lat: String(destination.lat),
        lon: String(destination.lon),
        lang: 'en',
      })
      try {
        const response = await fetch(url, {
          signal: deadline(signal, 6_000),
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) continue
        const data = await response.json()
        const feature = data.features?.[0]
        const coordinates = feature?.geometry?.coordinates
        const broadPlaceTypes = new Set([
          'city',
          'state',
          'country',
          'county',
          'district',
          'locality',
        ])
        if (coordinates?.length === 2 && !broadPlaceTypes.has(feature.properties?.type)) {
          const candidate = { lat: Number(coordinates[1]), lon: Number(coordinates[0]) }
          if (
            Number.isFinite(candidate.lat) &&
            Number.isFinite(candidate.lon) &&
            distanceKm(destination, candidate) <= 35
          ) {
            place = { ...candidate, name: feature.properties?.name || activity.title }
          }
        }
        itineraryPlaceCache.set(cacheKey, place || null)
        if (itineraryPlaceCache.size > 250)
          itineraryPlaceCache.delete(itineraryPlaceCache.keys().next().value)
      } catch (error) {
        if (error.name === 'AbortError') throw error
        continue
      }
    }
    if (!place) continue
    pins.push({ ...place, title: activity.title, day: activity.day, time: activity.time })
  }
  return pins
}

export async function getWikipedia(city, signal) {
  const cacheKey = city.trim().toLocaleLowerCase()
  const cached = wikipediaCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.data
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city.replaceAll(' ', '_'))}`
  const response = await fetch(url, {
    signal: deadline(signal, 8_000),
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(SERVICE_MESSAGES.encyclopediaUnavailable)
  const data = await response.json()
  if (!data.extract) throw new Error(SERVICE_MESSAGES.encyclopediaUnavailable)
  const result = {
    title: data.title || city,
    extract: data.extract,
    url:
      data.content_urls?.desktop?.page ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(city.replaceAll(' ', '_'))}`,
  }
  wikipediaCache.set(cacheKey, { data: result, expiresAt: Date.now() + 60 * 60 * 1000 })
  if (wikipediaCache.size > 100) wikipediaCache.delete(wikipediaCache.keys().next().value)
  return result
}

function readCachedItinerary(key) {
  const memoryEntry = itineraryCache.get(key)
  if (memoryEntry?.expiresAt > Date.now()) return memoryEntry.data
  if (memoryEntry) itineraryCache.delete(key)

  try {
    const entries = JSON.parse(sessionStorage.getItem(ITINERARY_SESSION_CACHE_KEY) || '[]')
    const match = entries.find((entry) => entry.key === key && entry.expiresAt > Date.now())
    if (match) {
      itineraryCache.set(key, match)
      return match.data
    }
  } catch {
    // Session storage is optional; server caching still reduces repeat generation.
  }
  return null
}

function saveItineraryCache(key, data) {
  const entry = { key, data, expiresAt: Date.now() + ITINERARY_CACHE_TTL }
  itineraryCache.set(key, entry)
  if (itineraryCache.size > 20) itineraryCache.delete(itineraryCache.keys().next().value)

  try {
    const savedEntries = JSON.parse(sessionStorage.getItem(ITINERARY_SESSION_CACHE_KEY) || '[]')
    const entries = savedEntries
      .filter((saved) => saved.expiresAt > Date.now() && saved.key !== key)
      .concat(entry)
      .slice(-5)
    sessionStorage.setItem(ITINERARY_SESSION_CACHE_KEY, JSON.stringify(entries))
  } catch {
    // A full or disabled storage area must not block itinerary generation.
  }
}

export async function requestItinerary(trip, signal) {
  signal?.throwIfAborted()
  const payload = { ...trip, budget: trip.budget || null }
  const cacheKey = `itinerary-prompt-v1:${JSON.stringify(payload)}`
  const cached = readCachedItinerary(cacheKey)
  if (cached) return { ...cached, cached: true }

  const pending = itineraryRequests.get(cacheKey)
  if (pending) return pending

  const request = (async () => {
    const response = await fetch('/api/itinerary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok)
      throw Object.assign(new Error(data.error || SERVICE_MESSAGES.itineraryUnavailable), {
        code: data.code,
        status: response.status,
      })
    saveItineraryCache(cacheKey, data)
    return data
  })()
  itineraryRequests.set(cacheKey, request)
  try {
    return await request
  } finally {
    if (itineraryRequests.get(cacheKey) === request) itineraryRequests.delete(cacheKey)
  }
}
