import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('requestItinerary cache', () => {
  let requestItinerary

  beforeEach(async () => {
    vi.resetModules()
    sessionStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ title: 'Jaipur escape', days: [{ day: 1, activities: [] }] }),
      }),
    )
    const travel = await import('./travel.js')
    requestItinerary = travel.requestItinerary
  })

  afterEach(() => vi.unstubAllGlobals())

  it('reuses the same itinerary request from the current browser session', async () => {
    const request = { source: 'Delhi', destination: 'Jaipur', days: 1, preferences: null }

    const first = await requestItinerary(request)
    const second = await requestItinerary(request)

    expect(first.title).toBe('Jaipur escape')
    expect(second.cached).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('keeps different trip preferences as separate cached plans', async () => {
    await requestItinerary({ destination: 'Jaipur', preferences: { pace: 'relaxed' } })
    await requestItinerary({ destination: 'Jaipur', preferences: { pace: 'active' } })

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('shares one in-flight API request between duplicate submissions', async () => {
    const request = { destination: 'Jaipur', preferences: { pace: 'balanced' } }

    await Promise.all([requestItinerary(request), requestItinerary(request)])

    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
