import type { FormEvent, RefObject } from 'react'
import type {
  ActivityPin,
  BudgetAllocation,
  CityLocation,
  CitySuggestion,
  DayRoute,
  Itinerary,
  LocationStatus,
  TripForm,
  WikipediaSummary,
} from '../../types/trip.types'

export interface AppContentState {
  theme: 'light' | 'dark'
  focusMode: 'keyboard' | 'pointer'
  locationStatus: LocationStatus
  form: TripForm
  loading: boolean
  error: string
  trip: Itinerary | null
  tripForm: TripForm | null
  expandedDay: number
  budgetAllocation: BudgetAllocation | null
  places: { source?: CityLocation | null; destination?: CityLocation | null }
  pickedCities: { source?: CitySuggestion | null; destination?: CitySuggestion | null }
  activityPins: ActivityPin[]
  dayRoutes: DayRoute[]
  wiki: WikipediaSummary | null
  personalizationLabels: string[]
}

export interface AppContentActions {
  toggleTheme: () => void
  useCurrentLocation: () => void
  planTrip: (event?: FormEvent<HTMLFormElement>) => void | Promise<void>
  update: (field: keyof TripForm, value: unknown) => void
  updateTripStartDate: (date: string) => void
  updateTripEndDate: (date: string) => void
  swapCities: () => void
  pickSource: (city: CitySuggestion | null) => void
  pickDestination: (city: CitySuggestion | null) => void
  dismissError: () => void
  toggleDay: (day: number) => void
}

export interface AppContentProps {
  state: AppContentState
  actions: AppContentActions
  resultsRef: RefObject<HTMLElement | null>
}
