import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { INITIAL_FORM } from '../../constants/trip.js'
import TripResults from './TripResults'

vi.mock('../TripMap/TripMap', () => ({ default: () => <div>Map preview</div> }))

describe('TripResults', () => {
  it('shows the itinerary and destination map after planning', async () => {
    const state = {
      form: { ...INITIAL_FORM, source: 'Delhi', destination: 'Jaipur' },
      trip: {
        title: 'Jaipur escape',
        overview: 'A city break.',
        days: [
          {
            day: 1,
            theme: 'Old city',
            activities: [
              { time: 'Morning', title: 'Amber Fort', description: 'Explore the fort.' },
            ],
          },
        ],
        travel: { mode: 'Train', note: 'A short journey.' },
      },
      tripForm: null,
      expandedDay: 1,
      budgetAllocation: null,
      places: { destination: { name: 'Jaipur', label: 'Jaipur', lat: 26.9, lon: 75.8 } },
      pickedCities: {},
      activityPins: [],
      dayRoutes: [],
      wiki: null,
      personalizationLabels: [],
      loading: false,
      error: '',
      nearby: [],
    }

    render(
      <TripResults
        state={state}
        actions={{ toggleDay: vi.fn(), dismissError: vi.fn() }}
        resultsRef={{ current: null }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Jaipur escape' })).toBeInTheDocument()
    expect(screen.getByText('Amber Fort')).toBeInTheDocument()
    expect(screen.getByText('Map preview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Print or save as PDF/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Share itinerary/ })).not.toBeInTheDocument()
  })
})
