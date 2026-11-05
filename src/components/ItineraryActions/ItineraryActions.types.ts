import type {
  ActivityPin,
  CityLocation,
  CitySuggestion,
  DayRoute,
  Itinerary,
  TripForm,
  WikipediaSummary,
} from '../../types/trip.types'

export interface ShareableItineraryData {
  form: TripForm
  trip: Itinerary
  tripForm: TripForm
  places: { source?: CityLocation | null; destination?: CityLocation | null }
  pickedCities: { source?: CitySuggestion | null; destination?: CitySuggestion | null }
  wiki: WikipediaSummary | null
  activityPins: ActivityPin[]
  dayRoutes: DayRoute[]
}

export interface ItineraryActionsProps {
  title: string
  data: ShareableItineraryData
}
