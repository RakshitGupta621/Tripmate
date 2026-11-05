import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { INITIAL_FORM } from '../../constants/trip.js'
import TripPlanner from './TripPlanner'

describe('TripPlanner', () => {
  it('renders trip dates, total budget, and destination fields', () => {
    render(
      <TripPlanner
        form={{ ...INITIAL_FORM, interests: [] }}
        loading={false}
        locationStatus="manual"
        useCurrentLocation={vi.fn()}
        error=""
        pickedCities={{}}
        planTrip={vi.fn()}
        update={vi.fn()}
        updateTripStartDate={vi.fn()}
        updateTripEndDate={vi.fn()}
        swapCities={vi.fn()}
        pickSource={vi.fn()}
        pickDestination={vi.fn()}
        dismissError={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('DEPARTURE')).toBeInTheDocument()
    expect(screen.getByLabelText('TOTAL TRIP BUDGET')).toBeInTheDocument()
    expect(screen.getByLabelText('HEADING TO')).toBeInTheDocument()
  })
})
