import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HeroSection from './HeroSection'

describe('HeroSection', () => {
  it('introduces the trip planner', () => {
    render(<HeroSection />)

    expect(screen.getByRole('heading', { name: /Go somewhere good/ })).toBeInTheDocument()
  })
})
