const geoCache = new Map()
const suggestionCache = new Map()
const itineraryPlaceCache = new Map()
const deadline = (signal, ms) => signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms)
let geocodeQueue = Promise.resolve()
let lastGeocodeAt = 0

function wait(ms, signal) {
  if (signal?.aborted) return Promise.reject(signal.reason)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve() }, ms)
    const onAbort = () => { clearTimeout(timer); reject(signal.reason) }
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
    try { response = await fetch(url, { signal: deadline(signal, 10_000), headers: { 'Accept-Language': 'en' } }) }
    catch (error) {
      if (error.name === 'TimeoutError') throw new Error('City search took too long. Check your connection and try again.')
      throw error
    } finally { lastGeocodeAt = Date.now() }
    if (!response.ok) throw new Error('City search is temporarily unavailable.')
    const results = await response.json()
    const place = results[0]
    if (!place) throw new Error(`We couldn't find “${city}”. Try a city name with its country.`)
    const result = { lat: Number(place.lat), lon: Number(place.lon), label: place.display_name, name: place.name || city }
    geoCache.set(key, result)
    return result
  })
  geocodeQueue = request.catch(() => {})
  return request
}

export async function suggestCities(query, signal) {
  const key = query.trim().toLocaleLowerCase()
  if (key.length < 2) return []
  if (suggestionCache.has(key)) return suggestionCache.get(key)
  const url = new URL('https://photon.komoot.io/api/')
  url.search = new URLSearchParams({ q: query.trim(), limit: '10', lang: 'en' })
  const response = await fetch(url, { signal: deadline(signal, 8_000), headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('City suggestions are temporarily unavailable.')
  const data = await response.json()
  const seen = new Set()
  const cities = (data.features || []).flatMap((feature) => {
    const props = feature.properties || {}
    if (props.osm_key !== 'place' || !['city', 'town', 'village'].includes(props.osm_value)) return []
    const name = props.name || props.city
    if (!name) return []
    const parts = [name, props.state, props.country].filter((part, index, all) => part && all.indexOf(part) === index)
    const label = parts.join(', ')
    const identity = label.toLocaleLowerCase()
    if (seen.has(identity)) return []
    seen.add(identity)
    return [{ name, label, query: label, lat: feature.geometry?.coordinates?.[1], lon: feature.geometry?.coordinates?.[0], country: props.country }]
  })
  const results = cities.slice(0, 6)
  suggestionCache.set(key, results)
  if (suggestionCache.size > 100) suggestionCache.delete(suggestionCache.keys().next().value)
  return results
}

function distanceKm(a, b) {
  const radians = (degrees) => degrees * Math.PI / 180
  const lat1 = radians(a.lat)
  const lat2 = radians(b.lat)
  const deltaLat = radians(b.lat - a.lat)
  const deltaLon = radians(b.lon - a.lon)
  const haversine = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
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
      url.search = new URLSearchParams({ q: `${activity.title}, ${destination.name || destination.label}`, limit: '1', lat: String(destination.lat), lon: String(destination.lon), lang: 'en' })
      try {
        const response = await fetch(url, { signal: deadline(signal, 6_000), headers: { Accept: 'application/json' } })
        if (!response.ok) continue
        const data = await response.json()
        const feature = data.features?.[0]
        const coordinates = feature?.geometry?.coordinates
        const broadPlaceTypes = new Set(['city', 'state', 'country', 'county', 'district', 'locality'])
        if (coordinates?.length === 2 && !broadPlaceTypes.has(feature.properties?.type)) {
          const candidate = { lat: Number(coordinates[1]), lon: Number(coordinates[0]) }
          if (Number.isFinite(candidate.lat) && Number.isFinite(candidate.lon) && distanceKm(destination, candidate) <= 35) {
            place = { ...candidate, name: feature.properties?.name || activity.title }
          }
        }
        itineraryPlaceCache.set(cacheKey, place || null)
        if (itineraryPlaceCache.size > 250) itineraryPlaceCache.delete(itineraryPlaceCache.keys().next().value)
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
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city.replaceAll(' ', '_'))}`
  const response = await fetch(url, { signal: deadline(signal, 8_000), headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('No encyclopedia summary found.')
  const data = await response.json()
  if (!data.extract) throw new Error('No encyclopedia summary found.')
  return { title: data.title || city, extract: data.extract, url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(city.replaceAll(' ', '_'))}`, thumbnail: data.thumbnail?.source }
}

export async function getNearbyCities({ lat, lon }, signal) {
  const query = `[out:json][timeout:12];(node[place~"^(city|town)$"](around:100000,${lat},${lon}););out center tags 12;`
  const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: query }), signal: deadline(signal, 14_000) })
  if (!response.ok) throw new Error('Nearby places are unavailable.')
  const data = await response.json()
  return (data.elements || []).map((place) => ({ name: place.tags?.name, lat: place.lat, lon: place.lon })).filter((place) => place.name).slice(0, 6)
}

export async function requestItinerary(trip, signal) {
  const payload = { ...trip, budget: trip.budget || null }
  const response = await fetch('/api/itinerary', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(data.error || 'We could not create this itinerary. Please try again.'), { code: data.code, status: response.status })
  return data
}
