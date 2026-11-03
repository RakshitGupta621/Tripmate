import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CityAutocomplete from './CityAutocomplete.jsx'

vi.mock('../services/travel.js', () => ({
  suggestCities: vi.fn(async () => [{ name: 'Jaipur', label: 'Jaipur, Rajasthan, India', query: 'Jaipur, Rajasthan, India', lat: 26.9, lon: 75.8, country: 'India', state: 'Rajasthan' }]),
}))

describe('CityAutocomplete', () => {
  afterEach(() => vi.clearAllMocks())

  it('shows matching cities after typing and selects a disambiguated city', async () => {
    const onChange = vi.fn()
    const onPick = vi.fn()
    render(<CityAutocomplete id="destination" label="HEADING TO" value="Ja" onChange={onChange} onPick={onPick} placeholder="City" />)

    const option = await screen.findByRole('option', { name: /Jaipur Rajasthan, India/i })
    fireEvent.click(option)

    expect(onChange).toHaveBeenCalledWith('Jaipur, Rajasthan, India')
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ lat: 26.9, lon: 75.8 }))
  })

  it('supports keyboard selection from the suggestions list', async () => {
    const onChange = vi.fn()
    render(<CityAutocomplete id="source" label="STARTING FROM" value="Ja" onChange={onChange} placeholder="City" />)
    const input = screen.getByRole('combobox')
    await screen.findByRole('option', { name: /Jaipur Rajasthan, India/i })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('Jaipur, Rajasthan, India')
  })
})
