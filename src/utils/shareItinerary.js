const SHARE_MARKER = '#tripmate='
const SHARE_VERSION = 1

function encodeBase64Url(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function decodeBase64Url(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// Keep share links self-contained and readable by browsers without compression support.
export async function createItineraryShareUrl(payload, currentUrl = window.location.href) {
  const compactPayload = {
    form: payload.tripForm || payload.form,
    trip: payload.trip,
    places: payload.places,
    pickedCities: payload.pickedCities,
    wiki: payload.wiki,
    activityPins: payload.activityPins,
  }
  const json = new TextEncoder().encode(
    JSON.stringify({ version: SHARE_VERSION, payload: compactPayload }),
  )
  const marker = `raw:${encodeBase64Url(json)}`

  const baseUrl = currentUrl.split('#')[0]
  return `${baseUrl}${SHARE_MARKER}${marker}`
}

export function hasSharedItineraryHash(hash = window.location.hash) {
  return hash.startsWith(SHARE_MARKER)
}

export async function readSharedItinerary(hash = window.location.hash) {
  if (!hasSharedItineraryHash(hash)) return null

  try {
    const encoded = hash.slice(SHARE_MARKER.length)
    const [encoding, data] = encoded.split(':', 2)
    const bytes = decodeBase64Url(data || '')
    const decoded =
      encoding === 'gz' && typeof DecompressionStream === 'function'
        ? await gunzip(bytes)
        : encoding === 'raw'
          ? bytes
          : null
    if (!decoded) return null

    const envelope = JSON.parse(new TextDecoder().decode(decoded))
    const payload = envelope?.version === SHARE_VERSION ? envelope.payload : null
    const form = payload?.form || payload?.tripForm
    if (!form?.destination || !Array.isArray(payload?.trip?.days)) return null
    return payload
  } catch {
    return null
  }
}
