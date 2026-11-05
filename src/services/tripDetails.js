const ROUTE_URL = 'https://valhalla1.openstreetmap.de/route'
const ROUTE_TTL = 6 * 60 * 60 * 1000
const routeCache = new Map()

function withTimeout(signal, milliseconds) {
  return signal
    ? AbortSignal.any([signal, AbortSignal.timeout(milliseconds)])
    : AbortSignal.timeout(milliseconds)
}

function isExpired(cache, key) {
  const entry = cache.get(key)
  if (!entry) return true
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return true
  }
  return false
}

function cacheResult(cache, key, data, ttl, maxEntries) {
  cache.set(key, { data, expiresAt: Date.now() + ttl })
  if (cache.size > maxEntries) cache.delete(cache.keys().next().value)
}

function decodePolyline(encoded, precision = 6) {
  let index = 0
  let latitude = 0
  let longitude = 0
  const factor = 10 ** precision
  const coordinates = []
  while (index < encoded.length) {
    let result = 0
    let shift = 0
    let byte
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    latitude += result & 1 ? ~(result >> 1) : result >> 1
    result = 0
    shift = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    longitude += result & 1 ? ~(result >> 1) : result >> 1
    coordinates.push([latitude / factor, longitude / factor])
  }
  return coordinates
}

export async function getDayRoutes(activityPins, costing = 'pedestrian', signal) {
  const days = new Map()
  for (const pin of activityPins) {
    const day = Number(pin.day)
    if (!days.has(day)) days.set(day, [])
    days.get(day).push(pin)
  }

  const routes = {}
  for (const [day, stops] of days) {
    if (stops.length < 2) continue
    const locations = stops.map(({ lat, lon }) => ({ lat, lon }))
    const key = `${costing}|${locations.map(({ lat, lon }) => `${lat.toFixed(4)},${lon.toFixed(4)}`).join(';')}`
    if (!isExpired(routeCache, key)) {
      routes[day] = routeCache.get(key).data
      continue
    }

    const url = new URL(ROUTE_URL)
    url.searchParams.set(
      'json',
      JSON.stringify({ locations, costing, units: 'kilometers', directions_type: 'none' }),
    )
    try {
      const response = await fetch(url, {
        signal: withTimeout(signal, 10_000),
        headers: { Accept: 'application/json', 'X-Client-Id': 'tripmate-elo3.onrender.com' },
      })
      if (!response.ok) continue
      const payload = await response.json()
      const trip = payload.trip
      const legs = trip?.legs?.filter((leg) => leg.shape) || []
      if (!trip?.summary || !legs.length) continue
      const coordinates = legs.flatMap((leg, index) => {
        const points = decodePolyline(leg.shape)
        return index === 0 ? points : points.slice(1)
      })
      const segments = legs.map((leg, index) => ({
        from: stops[index]?.title || `Stop ${index + 1}`,
        to: stops[index + 1]?.title || `Stop ${index + 2}`,
        distanceKm: leg.summary?.length,
        durationMinutes: Math.round((leg.summary?.time || 0) / 60),
      }))
      const result = {
        coordinates,
        distanceKm: trip.summary.length,
        durationMinutes: Math.round(trip.summary.time / 60),
        segments,
      }
      routes[day] = result
      cacheResult(routeCache, key, result, ROUTE_TTL, 200)
    } catch (error) {
      if (error.name === 'AbortError') throw error
    }
  }
  return routes
}

export function buildDirectionsUrl(stops, costing = 'pedestrian') {
  if (!Array.isArray(stops) || stops.length < 2) return null
  const coordinates = (stop) => `${stop.lat},${stop.lon}`
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('origin', coordinates(stops[0]))
  url.searchParams.set('destination', coordinates(stops[stops.length - 1]))
  if (stops.length > 2)
    url.searchParams.set('waypoints', stops.slice(1, -1).map(coordinates).join('|'))
  url.searchParams.set('travelmode', costing === 'auto' ? 'driving' : 'walking')
  return url.toString()
}
