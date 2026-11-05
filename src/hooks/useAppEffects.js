import { useEffect, useRef, useState } from 'react'
import { getDayRoutes } from '../services/tripDetails.js'
import { SESSION_RESULT_KEY, SESSION_RESULT_TTL } from '../constants/trip.js'

const NAVIGATION_KEYS = new Set([
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'Escape',
])

// Track keyboard vs pointer input in React so focus styling stays declarative.
export function useInputModality() {
  const [modality, setModality] = useState('pointer')

  useEffect(() => {
    const onKeyDown = (event) => {
      const activatesControl =
        ['Enter', ' '].includes(event.key) &&
        event.target?.matches?.(
          'button, a, summary, input[type="checkbox"], input[type="range"], [role="option"]',
        )
      if (NAVIGATION_KEYS.has(event.key) || activatesControl) setModality('keyboard')
    }
    const onPointerDown = () => setModality('pointer')
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])

  return modality
}

// Leaflet owns its viewport, so this hook synchronizes map bounds after pins load.
export function useDayRoutes(activityPins, mode, initialPins, initialMode, initialRoutes) {
  const [routeSnapshot, setRouteSnapshot] = useState(() => ({
    pins: initialPins,
    mode: initialMode,
    routes: initialRoutes || {},
  }))
  const pinsKey = JSON.stringify(activityPins)

  useEffect(() => {
    if (initialPins === activityPins && mode === initialMode) return undefined
    if (activityPins.length < 2) return undefined

    const controller = new AbortController()
    getDayRoutes(activityPins, mode, controller.signal)
      .then((nextRoutes) => {
        if (!controller.signal.aborted) {
          setRouteSnapshot({ pins: activityPins, mode, routes: nextRoutes })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRouteSnapshot({ pins: activityPins, mode, routes: {} })
        }
      })
    return () => controller.abort()
  }, [activityPins, initialPins, initialMode, mode])

  const hasRouteSnapshot =
    activityPins.length >= 2 &&
    routeSnapshot.mode === mode &&
    JSON.stringify(routeSnapshot.pins) === pinsKey
  return hasRouteSnapshot ? routeSnapshot.routes : {}
}

// Session storage is a best-effort cache; the live React state remains authoritative.
export function useTripSessionPersistence(snapshot) {
  const { form, tripForm, trip, places, pickedCities, wiki, activityPins, dayRoutes } = snapshot

  useEffect(() => {
    try {
      if (!trip) {
        sessionStorage.removeItem(SESSION_RESULT_KEY)
        return
      }
      const cached = {
        expiresAt: Date.now() + SESSION_RESULT_TTL,
        form: tripForm || form,
        tripForm: tripForm || form,
        trip,
        places,
        pickedCities,
        wiki,
        activityPins,
        dayRoutes,
      }
      sessionStorage.setItem(SESSION_RESULT_KEY, JSON.stringify(cached))
    } catch {
      // Storage can be disabled or full; this does not affect the current trip.
    }
  }, [form, tripForm, trip, places, pickedCities, wiki, activityPins, dayRoutes])
}

// Focus and scroll only after a newly generated result appears, not on restore.
export function useFocusResultsOnTrip(trip, restoredTrip, resultsRef) {
  const restoredTripRef = useRef(restoredTrip)

  useEffect(() => {
    if (!trip || trip === restoredTripRef.current || !resultsRef.current) return
    resultsRef.current.focus({ preventScroll: true })
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
    resultsRef.current.scrollIntoView?.({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [trip, restoredTrip, resultsRef])
}
