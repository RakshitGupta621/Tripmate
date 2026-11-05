import type { CitySuggestion, LocationStatus } from '../../types/trip.types'

export interface CityAutocompleteProps {
  id: string
  className?: string
  label: string
  value: string
  onChange: (value: string) => void
  onPick?: (city: CitySuggestion | null) => void
  placeholder: string
  selectedValue?: string
  locationStatus?: LocationStatus
  onUseLocation?: () => void
}

export interface CitySearchResult {
  query: string
  suggestions: CitySuggestion[]
  status: 'idle' | 'loading' | 'ready' | 'unavailable'
}
