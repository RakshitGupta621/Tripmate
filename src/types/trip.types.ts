export interface CitySuggestion {
  name: string
  label: string
  query: string
  lat?: number
  lon?: number
  state?: string
  country?: string
}

export interface CityLocation {
  name: string
  label: string
  lat: number
  lon: number
}

export interface TripForm {
  source: string
  destination: string
  days: number
  people: number
  budget: number
  includeBudget: boolean
  startDate: string
  endDate: string
  travelStyle: string
  interests: string[]
  familyFriendly: boolean
  intercityTransport: string
  localTransport: string
  departurePeriod: string
  arrivalPeriod: string
  directionsMode: string
}

export interface BudgetCategory {
  category: string
  percent: number
  amount: number
}

export interface BudgetAllocation {
  total: number
  people: number
  currency: string
  categories: BudgetCategory[]
  estimated?: boolean
}

export interface ActivityPin {
  title: string
  day: number
  time: string
  lat: number
  lon: number
}

export interface DayRoute {
  coordinates: [number, number][]
}

export interface ItineraryActivity {
  title: string
  time: string
  duration?: string
  area?: string
  description: string
}

export interface ItineraryDay {
  day: number
  theme?: string
  activities: ItineraryActivity[]
}

export interface Itinerary {
  title?: string
  overview?: string
  days: ItineraryDay[]
  travel?: {
    mode?: string
    note?: string
    departureWindow?: string
    arrivalWindow?: string
    localMode?: string
    localNote?: string
  }
  budgetAllocation?: BudgetAllocation
}

export interface WikipediaSummary {
  title: string
  extract: string
  url: string
}

export type LocationStatus =
  'loading' | 'ready' | 'denied' | 'unavailable' | 'unsupported' | 'manual'
