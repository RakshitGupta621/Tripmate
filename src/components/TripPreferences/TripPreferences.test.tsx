import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { INITIAL_FORM } from '../../constants/trip.js'
import TripPreferences from './TripPreferences'

describe('TripPreferences', () => {
  it('reveals trip style, interests, and family-friendly choices', () => {
    render(<TripPreferences form={INITIAL_FORM} update={vi.fn()} />)

    fireEvent.click(screen.getByText('Trip preferences'))

    expect(screen.getByText('TRAVEL STYLE')).toBeInTheDocument()
    expect(screen.getByText('WHAT DO YOU ENJOY?')).toBeInTheDocument()
    expect(screen.getByLabelText('Make suggestions family-friendly')).toBeInTheDocument()
  })
})
