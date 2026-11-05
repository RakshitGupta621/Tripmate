import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SpotlightSurface from './SpotlightSurface'

describe('SpotlightSurface', () => {
  it('renders its content inside the spotlight surface', () => {
    render(
      <SpotlightSurface as="section" aria-label="Trip summary">
        A thoughtful trip
      </SpotlightSurface>,
    )

    expect(screen.getByRole('region', { name: 'Trip summary' })).toHaveTextContent(
      'A thoughtful trip',
    )
  })
})
