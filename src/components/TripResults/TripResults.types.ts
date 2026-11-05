import type { RefObject } from 'react'
import type { AppContentActions, AppContentState } from '../AppContent/AppContent.types'

export interface TripResultsProps {
  state: Pick<
    AppContentState,
    | 'form'
    | 'trip'
    | 'tripForm'
    | 'expandedDay'
    | 'budgetAllocation'
    | 'places'
    | 'pickedCities'
    | 'activityPins'
    | 'dayRoutes'
    | 'wiki'
    | 'personalizationLabels'
    | 'error'
  >
  actions: Pick<AppContentActions, 'toggleDay' | 'dismissError'>
  resultsRef: RefObject<HTMLElement | null>
}
