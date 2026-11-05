import { useCallback, useEffect, useRef, useState } from 'react'
import { INITIAL_FORM } from '../constants/trip.js'
import {
  useDayRoutes,
  useFocusResultsOnTrip,
  useInputModality,
  useTripSessionPersistence,
} from './useAppEffects.js'
import { readSessionResult } from '../utils/session.js'
import { reverseGeocodeCity } from '../services/travel.js'
import type {
  ActivityPin,
  CityLocation,
  CitySuggestion,
  Itinerary,
  LocationStatus,
  TripForm,
  WikipediaSummary,
} from '../types/trip.types'

interface CityPair {
  source: CityLocation | null
  destination: CityLocation | null
}

interface PickedCityPair {
  source: CitySuggestion | null
  destination: CitySuggestion | null
}

export function useTripPlannerState() {
  const [sessionSeed] = useState(readSessionResult)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('tripmate-theme') === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })
  const [form, setForm] = useState<TripForm>(() => sessionSeed?.form || INITIAL_FORM)
  const [trip, setTrip] = useState<Itinerary | null>(() => sessionSeed?.trip || null)
  const [tripForm, setTripForm] = useState<TripForm | null>(
    () => sessionSeed?.tripForm || sessionSeed?.form || null,
  )
  const [places, setPlaces] = useState<CityPair>(
    () => sessionSeed?.places || { source: null, destination: null },
  )
  const [pickedCities, setPickedCities] = useState<PickedCityPair>(
    () => sessionSeed?.pickedCities || { source: null, destination: null },
  )
  const [wiki, setWiki] = useState<WikipediaSummary | null>(() => sessionSeed?.wiki || null)
  const [activityPins, setActivityPins] = useState<ActivityPin[]>(
    () => sessionSeed?.activityPins || [],
  )
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() => {
    if (sessionSeed?.form?.source) return 'manual'
    return typeof navigator !== 'undefined' && navigator.geolocation ? 'loading' : 'unsupported'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedDay, setExpandedDay] = useState(1)
  const controllerRef = useRef<AbortController | null>(null)
  const resultsRef = useRef<HTMLElement>(null)
  const sourceEditedRef = useRef(false)
  const initialLocationRequestedRef = useRef(false)
  const focusMode = useInputModality() as 'keyboard' | 'pointer'
  const dayRoutes = useDayRoutes(
    activityPins,
    form.directionsMode,
    sessionSeed?.activityPins || null,
    sessionSeed?.tripForm?.directionsMode ||
      sessionSeed?.form?.directionsMode ||
      INITIAL_FORM.directionsMode,
    sessionSeed?.dayRoutes,
  )

  // Keep browser integrations at the state boundary, away from page rendering.
  useFocusResultsOnTrip(trip, sessionSeed?.trip || null, resultsRef)
  useTripSessionPersistence({
    form,
    tripForm,
    trip,
    places,
    pickedCities,
    wiki,
    activityPins,
    dayRoutes,
  })

  // Ask once on a new, blank plan; returning sessions keep their saved source city.
  const locate = useCallback((replaceSource = false, showLoading = true) => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      return
    }
    if (showLoading) setLocationStatus('loading')

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        reverseGeocodeCity(coords.latitude, coords.longitude)
          .then((city) => {
            if (!replaceSource && sourceEditedRef.current) {
              setLocationStatus('manual')
              return
            }
            setForm((current) =>
              current.source.trim() && !replaceSource
                ? current
                : { ...current, source: city.query },
            )
            setPickedCities((current) =>
              !replaceSource && current.source ? current : { ...current, source: city },
            )
            setLocationStatus('ready')
          })
          .catch(() => setLocationStatus('unavailable'))
      },
      (error) => {
        setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 12_000 },
    )
  }, [])

  useEffect(() => {
    if (
      initialLocationRequestedRef.current ||
      form.source.trim() ||
      locationStatus === 'unsupported'
    ) {
      return
    }
    initialLocationRequestedRef.current = true
    locate(false, false)
  }, [form.source, locationStatus, locate])

  function markSourceEdited() {
    sourceEditedRef.current = true
    setLocationStatus('manual')
  }

  function toggleTheme() {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('tripmate-theme', next)
      } catch {
        // The selected theme remains active for this session if storage is unavailable.
      }
      return next
    })
  }

  return {
    sessionSeed,
    theme,
    toggleTheme,
    form,
    setForm,
    trip,
    setTrip,
    tripForm,
    setTripForm,
    places,
    setPlaces,
    pickedCities,
    setPickedCities,
    wiki,
    setWiki,
    activityPins,
    setActivityPins,
    locationStatus,
    requestCurrentLocation: () => locate(true),
    markSourceEdited,
    error,
    setError,
    loading,
    setLoading,
    expandedDay,
    setExpandedDay,
    controllerRef,
    resultsRef,
    focusMode,
    dayRoutes,
  }
}
