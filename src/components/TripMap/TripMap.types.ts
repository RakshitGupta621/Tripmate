import type { ActivityPin, CityLocation, DayRoute } from '../../types/trip.types'

export interface TripMapProps {
  destination: CityLocation | null
  activityPins?: ActivityPin[]
  dayRoutes?: DayRoute[]
}

export interface FitPlacesProps {
  destination: CityLocation
  activityPins: ActivityPin[]
}
