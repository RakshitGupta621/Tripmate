import type { CitySuggestion, LocationStatus, TripForm } from '../../types/trip.types'
import type { AppContentActions } from '../AppContent/AppContent.types'

export interface TripPlannerProps {
  form: TripForm
  loading: boolean
  locationStatus: LocationStatus
  useCurrentLocation: () => void
  error: string
  pickedCities: {
    source?: CitySuggestion | null
    destination?: CitySuggestion | null
  }
  planTrip: AppContentActions['planTrip']
  update: AppContentActions['update']
  updateTripStartDate: AppContentActions['updateTripStartDate']
  updateTripEndDate: AppContentActions['updateTripEndDate']
  swapCities: AppContentActions['swapCities']
  pickSource: AppContentActions['pickSource']
  pickDestination: AppContentActions['pickDestination']
  dismissError: AppContentActions['dismissError']
}
