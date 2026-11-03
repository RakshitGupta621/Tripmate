import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App.jsx'

vi.mock('./services/travel.js', () => ({
  geocodeCity: vi.fn(async (city) => ({ name: city, lat: 20, lon: 77, label: city })),
  geocodeItineraryPlaces: vi.fn(async () => []),
  suggestCities: vi.fn(async () => []),
  getWikipedia: vi.fn(async (city) => ({ title: city, extract: 'A lovely city.', url: 'https://en.wikipedia.org/' })),
  getNearbyCities: vi.fn(async () => [{ name: 'Ajmer', lat: 26, lon: 74 }]),
  requestItinerary: vi.fn(),
}))
vi.mock('./components/TripMap.jsx', () => ({ default: () => <div data-testid="map">Trip map</div> }))
import { requestItinerary } from './services/travel.js'

describe('TripMate planner', () => {
  beforeEach(() => { requestItinerary.mockReset() })
  afterEach(() => vi.restoreAllMocks())
  it('creates and displays an itinerary', async () => {
    requestItinerary.mockResolvedValue({ title: 'A Jaipur escape', overview: 'A good weekend.', days: [{ day: 1, theme: 'Pink city strolls', activities: [{ time: 'Morning', title: 'Visit the palace', description: 'Start early.' }] }], travel: { mode: 'Train', note: 'A short ride.' }, budgetAllocation: { total: 60000, perPerson: 30000, people: 2, currency: 'INR', categories: [{ category: 'Stay', percent: 35, amount: 21000 }] } })
    render(<App />)
    fireEvent.change(screen.getByLabelText('STARTING FROM'), { target: { value: 'Delhi' } })
    fireEvent.change(screen.getByLabelText('HEADING TO'), { target: { value: 'Jaipur' } })
    fireEvent.change(screen.getByLabelText('TRIP BUDGET / PERSON'), { target: { value: '30000' } })
    fireEvent.change(screen.getByLabelText('People count'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: /Build my trip/i }))
    expect(await screen.findByText('A Jaipur escape')).toBeInTheDocument()
    expect(screen.getByText('Visit the palace')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Budget allocation' })).toHaveTextContent('₹60,000')
    expect(requestItinerary).toHaveBeenCalledWith(expect.objectContaining({ budget: { amount: 30000, currency: 'INR' }, people: 2 }), expect.any(AbortSignal))
    expect(await screen.findByText('A lovely city.')).toBeInTheDocument()
  })
  it('shows nearby city suggestions on generation failure', async () => {
    requestItinerary.mockRejectedValue(new Error('The trip planner is busy.'))
    render(<App />)
    fireEvent.change(screen.getByLabelText('STARTING FROM'), { target: { value: 'Delhi' } })
    fireEvent.change(screen.getByLabelText('HEADING TO'), { target: { value: 'Jaipur' } })
    fireEvent.click(screen.getByRole('button', { name: /Build my trip/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The trip planner is busy.')
    await waitFor(() => expect(screen.getByRole('button', { name: /Ajmer/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Ajmer/i }))
    expect(screen.getByLabelText('HEADING TO')).toHaveValue('Ajmer')
  })
  it('keeps the budget in rupees with a fixed INR slider range', () => {
    render(<App />)
    const slider = screen.getByRole('slider', { name: 'Budget amount' })
    expect(slider).toHaveAttribute('min', '5000')
    expect(slider).toHaveAttribute('max', '500000')
    expect(slider).toHaveValue('30000')
    expect(screen.getByText('₹30,000')).toBeInTheDocument()
    expect(screen.queryByLabelText('Budget currency')).not.toBeInTheDocument()
  })
  it('selects a people count from the list', () => {
    render(<App />)
    const peopleSelect = screen.getByLabelText('People count')
    expect(peopleSelect).toHaveValue('1')
    fireEvent.change(peopleSelect, { target: { value: '6' } })
    expect(peopleSelect).toHaveValue('6')
  })
})
