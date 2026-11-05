import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AppContent from './AppContent'
import { INITIAL_FORM } from '../../constants/trip.js'
import type { AppContentActions } from './AppContent.types'

vi.mock('../TripMap/TripMap', () => ({ default: () => <div>Map preview</div> }))

describe('AppContent', () => {
  it('renders the trip planner shell and form controls', () => {
    const state = {
      theme: 'light' as const,
      focusMode: 'pointer' as const,
      locationStatus: 'manual' as const,
      form: { ...INITIAL_FORM, interests: [] },
      loading: false,
      error: '',
      trip: null,
      tripForm: null,
      expandedDay: 1,
      budgetAllocation: null,
      places: {},
      pickedCities: {},
      activityPins: [],
      dayRoutes: [],
      wiki: null,
      personalizationLabels: [],
    }
    const actions: AppContentActions = {
      toggleTheme: vi.fn(),
      useCurrentLocation: vi.fn(),
      planTrip: vi.fn(),
      update: vi.fn(),
      updateTripStartDate: vi.fn(),
      updateTripEndDate: vi.fn(),
      swapCities: vi.fn(),
      pickSource: vi.fn(),
      pickDestination: vi.fn(),
      dismissError: vi.fn(),
      toggleDay: vi.fn(),
    }

    render(<AppContent state={state} actions={actions} resultsRef={createRef()} />)

    expect(screen.getByRole('heading', { name: 'Where to next?' })).toBeInTheDocument()
    expect(screen.getByLabelText('STARTING FROM')).toBeInTheDocument()
    expect(screen.getByLabelText('HEADING TO')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Build my trip/ })).toBeInTheDocument()
  })
})
