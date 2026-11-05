import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mapApi = vi.hoisted(() => ({ fitBounds: vi.fn(), setView: vi.fn() }))

vi.mock('leaflet', () => ({ default: { divIcon: (options) => options } }))
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  Marker: ({ children }) => <div>{children}</div>,
  Polyline: () => null,
  Popup: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Tooltip: ({ children }) => <span>{children}</span>,
  ZoomControl: () => null,
  useMap: () => mapApi,
}))

import TripMap from './TripMap'

describe('TripMap', () => {
  it('shows an accessible map with destination and itinerary pins', () => {
    render(
      <TripMap
        destination={{ name: 'Delhi', label: 'Delhi, India', lat: 28.61, lon: 77.21 }}
        activityPins={[{ title: 'Red Fort', day: 1, time: 'Morning', lat: 28.65, lon: 77.24 }]}
      />,
    )

    expect(
      screen.getByRole('region', { name: 'Interactive destination city map' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Delhi · destination')).toBeInTheDocument()
    expect(screen.getByText('Day 1 · Red Fort')).toBeInTheDocument()
  })
})
