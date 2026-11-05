import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BudgetBreakdown from './BudgetBreakdown'

describe('BudgetBreakdown', () => {
  it('shows the whole-trip total and destination estimate categories', () => {
    render(
      <BudgetBreakdown
        allocation={{
          total: 20_000,
          people: 2,
          currency: 'INR',
          categories: [{ category: 'Stay', percent: 40, amount: 8_000 }],
        }}
      />,
    )

    expect(screen.getByRole('region', { name: 'Budget allocation' })).toHaveTextContent('₹20,000')
    expect(screen.getByText('Stay')).toBeInTheDocument()
    expect(screen.getByText('₹8,000')).toBeInTheDocument()
  })
})
