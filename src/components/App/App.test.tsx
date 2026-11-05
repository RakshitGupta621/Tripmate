import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'

vi.mock('../../services/travel.js', () => ({
  geocodeCity: vi.fn(async (city) => ({ name: city, lat: 20, lon: 77, label: city })),
  geocodeItineraryPlaces: vi.fn(async () => []),
  suggestCities: vi.fn(async () => []),
  getWikipedia: vi.fn(async (city) => ({
    title: city,
    extract: 'A lovely city.',
    url: 'https://en.wikipedia.org/',
  })),
  reverseGeocodeCity: vi.fn(async () => ({
    name: 'Delhi',
    query: 'Delhi, Delhi, India',
    label: 'Delhi, Delhi, India',
    lat: 28.6,
    lon: 77.2,
  })),
  requestItinerary: vi.fn(),
}))
vi.mock('../TripMap/TripMap', () => ({
  default: () => <div data-testid="map">Trip map</div>,
}))
import { requestItinerary, reverseGeocodeCity } from '../../services/travel.js'

const mockedRequestItinerary = vi.mocked(requestItinerary)

describe('TripMate planner', () => {
  beforeEach(() => {
    mockedRequestItinerary.mockReset()
    sessionStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(navigator, 'geolocation')
  })

  it('asks for location and fills the source city when access is granted', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({ coords: { latitude: 28.6, longitude: 77.2 } }),
        ),
      },
    })
    vi.mocked(reverseGeocodeCity).mockResolvedValue({
      name: 'Delhi',
      query: 'Delhi, Delhi, India',
      label: 'Delhi, Delhi, India',
      lat: 28.6,
      lon: 77.2,
    })

    render(<App />)

    await waitFor(() =>
      expect(screen.getByLabelText('STARTING FROM')).toHaveValue('Delhi, Delhi, India'),
    )
    expect(reverseGeocodeCity).toHaveBeenCalledWith(28.6, 77.2)
  })

  it('creates and displays an itinerary', async () => {
    mockedRequestItinerary.mockResolvedValue({
      title: 'A Jaipur escape',
      overview: 'A good weekend.',
      days: [
        {
          day: 1,
          theme: 'Pink city strolls',
          activities: [{ time: 'Morning', title: 'Visit the palace', description: 'Start early.' }],
        },
      ],
      travel: { mode: 'Train', note: 'A short ride.' },
      budgetAllocation: {
        total: 30000,
        people: 2,
        currency: 'INR',
        categories: [{ category: 'Stay', percent: 35, amount: 10500 }],
      },
    })
    render(<App />)
    fireEvent.change(screen.getByLabelText('STARTING FROM'), { target: { value: 'Delhi' } })
    fireEvent.change(screen.getByLabelText('HEADING TO'), { target: { value: 'Jaipur' } })
    fireEvent.change(screen.getByLabelText('TOTAL TRIP BUDGET'), { target: { value: '30000' } })
    fireEvent.change(screen.getByLabelText('DEPARTURE'), { target: { value: '2026-12-18' } })
    fireEvent.change(screen.getByLabelText('RETURN'), { target: { value: '2026-12-20' } })
    fireEvent.click(screen.getByRole('button', { name: 'PEOPLE' }))
    fireEvent.click(screen.getByRole('option', { name: '2 people' }))
    fireEvent.click(screen.getByRole('button', { name: /Build my trip/i }))
    expect(await screen.findByText('A Jaipur escape')).toBeInTheDocument()
    expect(screen.getByText('Visit the palace')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Budget allocation' })).toHaveTextContent('₹30,000')
    expect(screen.getByRole('region', { name: 'Budget allocation' })).toHaveTextContent(
      'total for the whole trip',
    )
    expect(screen.getByRole('region', { name: 'Budget allocation' })).toHaveTextContent('Travel')
    expect(screen.getByRole('region', { name: 'Budget allocation' })).toHaveTextContent('Food')
    expect(screen.queryByText(/category estimate was unavailable/i)).not.toBeInTheDocument()
    expect(mockedRequestItinerary).toHaveBeenCalledWith(
      expect.objectContaining({ budget: { amount: 30000, currency: 'INR' }, people: 2 }),
      expect.any(AbortSignal),
    )
    expect(await screen.findByText('A lovely city.')).toBeInTheDocument()
  })
  it('keeps the budget in rupees with a fixed INR slider range', () => {
    render(<App />)
    const slider = screen.getByRole('slider', { name: 'Total trip budget' })
    expect(slider).toHaveAttribute('min', '5000')
    expect(slider).toHaveAttribute('max', '500000')
    expect(slider).toHaveValue('30000')
    expect(screen.getByText('₹30,000')).toBeInTheDocument()
    expect(screen.queryByLabelText('Budget currency')).not.toBeInTheDocument()
  })
  it('selects a people count from the list', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PEOPLE' }))
    fireEvent.click(screen.getByRole('option', { name: '6 people' }))
    expect(screen.getByRole('button', { name: 'PEOPLE' })).toHaveTextContent('6 people')
  })
})
