import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { INITIAL_FORM } from '../../constants/trip.js'
import ItineraryActions from './ItineraryActions'

describe('ItineraryActions', () => {
  it('offers print and a single share control', async () => {
    const data = {
      form: { ...INITIAL_FORM, destination: 'Jaipur' },
      tripForm: { ...INITIAL_FORM, destination: 'Jaipur' },
      trip: { title: 'Jaipur escape', days: [{ day: 1, activities: [] }] },
      places: {},
      pickedCities: {},
      wiki: null,
      activityPins: [],
      dayRoutes: [],
    }
    render(<ItineraryActions title="Jaipur escape" data={data} />)

    expect(screen.getByRole('button', { name: /Print or save as PDF/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Share itinerary/ })).toBeInTheDocument()
    await screen.findByRole('button', { name: /Share itinerary/ })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})
