import { describe, expect, it } from 'vitest'
import { allocateBudget } from './budget.js'

describe('allocateBudget', () => {
  it('uses destination and preferences for a fallback estimate and preserves the total', () => {
    const allocation = allocateBudget({ amount: 1000.01, currency: 'INR' }, 2, [], {
      destination: 'Mumbai, India',
      days: 4,
      preferences: {
        transportPriority: 'luxury',
        intercityTransport: 'flight',
        localTransport: 'taxi',
        interests: ['Food', 'Shopping'],
        familyFriendly: true,
      },
    })
    expect(allocation.estimated).toBe(true)
    expect(allocation.total).toBe(1000.01)
    expect(allocation.people).toBe(2)
    expect(allocation.categories.map((item) => item.category)).toEqual([
      'Travel',
      'Stay',
      'Food',
      'Shopping',
      'Activities',
    ])
    expect(allocation.categories.reduce((sum, item) => sum + item.amount, 0)).toBeCloseTo(1000.01)
  })

  it('adapts its fallback split to city and selected interests', () => {
    const cityEstimate = allocateBudget({ amount: 30_000, currency: 'INR' }, 1, [], {
      destination: 'Mumbai',
      days: 3,
      preferences: { interests: ['Food'] },
    })
    const valueEstimate = allocateBudget({ amount: 30_000, currency: 'INR' }, 1, [], {
      destination: 'Jaipur',
      days: 3,
      preferences: { transportPriority: 'value', interests: ['History'] },
    })
    expect(cityEstimate.categories).not.toEqual(valueEstimate.categories)
    expect(
      cityEstimate.categories.find((item) => item.category === 'Food').percent,
    ).toBeGreaterThan(valueEstimate.categories.find((item) => item.category === 'Food').percent)
  })

  it('normalizes model category aliases and percent strings', () => {
    const allocation = allocateBudget(
      { amount: 1000.01, currency: 'INR' },
      2,
      [
        { category: 'Transportation', percent: '20%' },
        { category: 'Accommodation', percent: 40 },
        { category: 'Dining', percent: 20 },
        { category: 'Souvenirs', percent: 10 },
        { category: 'Experiences', percent: 20 },
      ],
      { destination: 'Jaipur', preferences: {} },
    )
    expect(allocation.estimated).toBe(false)
    expect(allocation.categories.map((item) => item.category)).toEqual([
      'Travel',
      'Stay',
      'Food',
      'Shopping',
      'Activities',
    ])
    expect(allocation.categories.reduce((sum, item) => sum + item.amount, 0)).toBeCloseTo(1000.01)
  })
})
