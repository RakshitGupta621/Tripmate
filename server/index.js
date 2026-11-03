import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeItinerary, validateTripRequest } from './itinerary.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const here = path.dirname(fileURLToPath(import.meta.url))
const cache = new Map()
const CACHE_TTL = 30 * 60 * 1000

app.use(express.json({ limit: '16kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, provider: 'groq', configured: Boolean(process.env.GROQ_API_KEY) }))

app.post('/api/itinerary', async (req, res) => {
  const validation = validateTripRequest(req.body)
  if (!validation.ok) return res.status(400).json({ error: validation.error, code: 'INVALID_REQUEST' })

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      error: 'TripMate needs a Groq API key. Add GROQ_API_KEY to your .env file and restart the server.',
      code: 'MISSING_GROQ_KEY',
    })
  }

  const { source, destination, days, people, budget } = validation.value
  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
  const budgetKey = budget ? `${budget.amount}|${budget.currency}` : 'no-budget'
  const cacheKey = `${model}|${source.toLowerCase()}|${destination.toLowerCase()}|${days}|${people}|${budgetKey}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return res.json({ ...cached.data, cached: true })
  if (cached) cache.delete(cacheKey)

  try {
    const itinerary = await makeItinerary({ source, destination, days, people, budget, apiKey: process.env.GROQ_API_KEY, model })
    cache.set(cacheKey, { data: itinerary, expiresAt: Date.now() + CACHE_TTL })
    res.json({ ...itinerary, cached: false })
  } catch (error) {
    console.error(`Itinerary request failed (${error.code || 'UNKNOWN'}; Groq model ${model}):`, error.message)
    res.status(error.status || 502).json({ error: error.message, code: error.code || 'GENERATION_FAILED' })
  }
})

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(here, '../dist')
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(port, () => console.log(`TripMate server listening on http://localhost:${port}`))
