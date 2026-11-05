import {
  geocodeCity,
  geocodeItineraryPlaces,
  getWikipedia,
  requestItinerary,
} from '../../services/travel.js'
import AppContent from '../AppContent/AppContent'
import { daysBetweenDates, getItineraryPreferences, getPreferenceLabels } from '../../utils/trip.js'
import { allocateBudget } from '../../utils/budget.js'
import { useTripPlannerState } from '../../hooks/useTripPlannerState'
import type { AppContentActions } from '../AppContent/AppContent.types'
import type { FormEvent } from 'react'
import { SERVICE_MESSAGES } from '../../utils/util_constants.js'
import { BUDGET_CATEGORY_NAMES } from '../../constants/trip.js'

export default function App() {
  const {
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
    requestCurrentLocation,
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
  } = useTripPlannerState()

  function update(field, value) {
    if (field === 'source') markSourceEdited()
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateTripStartDate(startDate) {
    setForm((current) => ({ ...current, startDate, endDate: '', days: 1 }))
  }

  function updateTripEndDate(endDate) {
    if (!form.startDate || !endDate) return
    const days = daysBetweenDates(form.startDate, endDate)
    if (days < 1 || days > 10) return
    setForm((current) => ({ ...current, endDate, days }))
  }

  async function planTrip(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const requestForm = form
    const requestCities = pickedCities
    if (!requestForm.startDate || !requestForm.endDate) {
      setError(SERVICE_MESSAGES.datesRequired)
      return
    }
    setError('')
    setTrip(null)
    setTripForm(null)
    setWiki(null)
    setActivityPins([])
    setLoading(true)
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    try {
      const sourceRequest =
        requestCities.source?.query === requestForm.source
          ? Promise.resolve(requestCities.source)
          : geocodeCity(requestForm.source, controller.signal)
      const destinationRequest =
        requestCities.destination?.query === requestForm.destination
          ? Promise.resolve(requestCities.destination)
          : geocodeCity(requestForm.destination, controller.signal)
      const [source, destination] = await Promise.all([sourceRequest, destinationRequest])
      setPlaces({ source, destination })
      const budget = requestForm.includeBudget
        ? { amount: Number(requestForm.budget), currency: 'INR' }
        : null
      const itineraryRequest: Record<string, unknown> = {
        source: requestForm.source,
        destination: requestForm.destination,
        days: requestForm.days,
        people: requestForm.people,
        budget,
      }
      const preferences = getItineraryPreferences(requestForm)
      if (preferences) itineraryRequest.preferences = preferences
      if (requestForm.startDate) itineraryRequest.startDate = requestForm.startDate
      const [itineraryResult, wikiResult] = await Promise.allSettled([
        requestItinerary(itineraryRequest, controller.signal),
        getWikipedia(requestForm.destination, controller.signal),
      ])
      if (controller.signal.aborted) return
      if (wikiResult.status === 'fulfilled') setWiki(wikiResult.value)
      if (itineraryResult.status === 'fulfilled') {
        const itinerary = itineraryResult.value
        setTrip(itinerary)
        setTripForm(requestForm)
        setExpandedDay(1)
        const activities = itinerary.days.flatMap((day) =>
          day.activities.map((activity) => ({ ...activity, day: day.day })),
        )
        geocodeItineraryPlaces(activities, destination, controller.signal)
          .then((pins) => {
            if (!controller.signal.aborted) setActivityPins(pins)
          })
          .catch(() => {})
      } else {
        setError(itineraryResult.reason.message)
      }
    } catch (err) {
      if (err.name !== 'AbortError')
        setError(err.message || 'Something went wrong while searching for your cities.')
    } finally {
      if (controllerRef.current === controller) setLoading(false)
    }
  }

  function swapCities() {
    markSourceEdited()
    setForm((current) => ({ ...current, source: current.destination, destination: current.source }))
    setPickedCities(({ source, destination }) => ({ source: destination, destination: source }))
  }

  function pickSource(city) {
    markSourceEdited()
    setPickedCities((current) => ({ ...current, source: city }))
  }
  function pickDestination(city) {
    setPickedCities((current) => ({ ...current, destination: city }))
  }
  const budgetForm = tripForm || form
  const savedAllocation = trip?.budgetAllocation
  const hasCompleteAllocation = BUDGET_CATEGORY_NAMES.every((category) =>
    savedAllocation?.categories?.some((item) => item.category === category),
  )
  const budgetAllocation = hasCompleteAllocation
    ? savedAllocation
    : savedAllocation || budgetForm.includeBudget
      ? allocateBudget(
          { amount: savedAllocation?.total || Number(budgetForm.budget), currency: 'INR' },
          Number(savedAllocation?.people || budgetForm.people),
          [],
          {
            destination: budgetForm.destination,
            preferences: getItineraryPreferences(budgetForm),
            days: budgetForm.days,
          },
        )
      : null
  const personalizationLabels = getPreferenceLabels(tripForm || form)

  const state = {
    theme,
    focusMode,
    locationStatus,
    form,
    loading,
    error,
    trip,
    tripForm,
    expandedDay,
    budgetAllocation,
    places,
    pickedCities,
    activityPins,
    dayRoutes,
    wiki,
    personalizationLabels,
  }
  const actions: AppContentActions = {
    toggleTheme,
    useCurrentLocation: requestCurrentLocation,
    planTrip,
    update,
    updateTripStartDate,
    updateTripEndDate,
    swapCities,
    pickSource,
    pickDestination,
    dismissError: () => setError(''),
    toggleDay: (day) => setExpandedDay((current) => (current === day ? 0 : day)),
  }

  return <AppContent state={state} actions={actions} resultsRef={resultsRef} />
}
