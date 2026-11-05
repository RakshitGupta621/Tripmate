import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ItineraryActions from './ItineraryActions'

describe('ItineraryActions', () => {
  it('keeps print available while sharing is disabled', () => {
    const onPrint = vi.fn()
    render(<ItineraryActions onPrint={onPrint} />)

    fireEvent.click(screen.getByRole('button', { name: /Print or save as PDF/ }))
    expect(onPrint).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: /Share itinerary/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
