import { describe, expect, it, vi, afterEach } from 'vitest'
import { allocateBudget, makeItinerary, validateTripRequest } from './itinerary.js'

describe('validateTripRequest', () => {
  it('trims and accepts a basic trip', () => {
    expect(validateTripRequest({ source: ' Delhi ', destination: 'Jaipur', days: 2 })).toEqual({ ok: true, value: { source: 'Delhi', destination: 'Jaipur', days: 2, people: 1, budget: null } })
  })
  it('rejects missing, identical, and out-of-range cities/durations', () => {
    expect(validateTripRequest({ source: '', destination: 'Jaipur', days: 2 }).ok).toBe(false)
    expect(validateTripRequest({ source: 'Delhi', destination: 'delhi', days: 2 }).ok).toBe(false)
    expect(validateTripRequest({ source: 'Delhi', destination: 'Jaipur', days: 11 }).ok).toBe(false)
    expect(validateTripRequest({ source: 'Delhi', destination: 'Jaipur', days: 2, people: 13 }).ok).toBe(false)
  })
  it('accepts rupee budgets and rejects invalid amounts or other currencies', () => {
    expect(validateTripRequest({ source: 'Delhi', destination: 'Jaipur', days: 2, budget: { amount: 12000.5, currency: 'inr' } }).value.budget).toEqual({ amount: 12000.5, currency: 'INR' })
    expect(validateTripRequest({ source: 'Delhi', destination: 'Jaipur', days: 2, budget: { amount: -4, currency: 'INR' } }).ok).toBe(false)
    expect(validateTripRequest({ source: 'Delhi', destination: 'Jaipur', days: 2, budget: { amount: 500, currency: 'JPY' } }).ok).toBe(false)
  })
  it('splits the total budget exactly across categories', () => {
    const allocation = allocateBudget({ amount: 1000.01, currency: 'INR' }, 2)
    expect(allocation.categories.map((item) => item.category)).toEqual(['Travel', 'Stay', 'Food', 'Shopping', 'Activities'])
    expect(allocation.total).toBe(2000.02)
    expect(allocation.perPerson).toBe(1000.01)
    expect(allocation.people).toBe(2)
    expect(allocation.categories.reduce((sum, item) => sum + item.amount, 0)).toBe(2000.02)
  })
})

describe('makeItinerary', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('generates an itinerary through Groq chat completions with JSON output', async () => {
    const data = { title: 'Jaipur weekend', days: [{ day: 1, activities: [{ title: 'Walk' }, { title: 'Lunch' }] }] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(data) } }] }) }))
    const result = await makeItinerary({ source: 'Delhi', destination: 'Jaipur', days: 1, people: 2, budget: { amount: 1000, currency: 'INR' }, apiKey: 'test' })
    expect(result).toEqual({ ...data, budgetAllocation: { total: 2000, perPerson: 1000, people: 2, currency: 'INR', categories: expect.any(Array) } })
    expect(result.budgetAllocation.categories.reduce((sum, item) => sum + item.amount, 0)).toBe(2000)
    const [url, options] = fetch.mock.calls[0]
    const requestBody = JSON.parse(options.body)
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions')
    expect(options.headers.authorization).toBe('Bearer test')
    expect(requestBody.model).toBe('qwen/qwen3.8-27b')
    expect(requestBody.response_format).toEqual({ type: 'json_object' })
    expect(requestBody.messages[0].content).toContain('do not include Delhi as a stop, activity, or itinerary destination')
    expect(requestBody.messages[0].content).toContain('Use Delhi only to recommend a likely way to travel')
  })
  it('reports rate limits and malformed responses clearly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    await expect(makeItinerary({ source: 'Delhi', destination: 'Jaipur', days: 1, apiKey: 'test' })).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'nope' } }] }) }))
    await expect(makeItinerary({ source: 'Delhi', destination: 'Jaipur', days: 1, apiKey: 'test' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})
