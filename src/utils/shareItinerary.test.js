import { describe, expect, it } from 'vitest'
import { createItineraryShareUrl, readSharedItinerary } from './shareItinerary.js'

describe('itinerary share links', () => {
  it('encodes an itinerary in the URL and restores it without a server lookup', async () => {
    const payload = {
      form: { source: 'Delhi', destination: 'Jaipur' },
      trip: { title: 'Jaipur escape', days: [{ day: 1, activities: [] }] },
    }
    const url = await createItineraryShareUrl(payload, 'https://tripmate.example/plan?mode=dark')
    const shared = await readSharedItinerary(new URL(url).hash)

    expect(url).toContain('https://tripmate.example/plan?mode=dark#tripmate=')
    expect(url).toContain('#tripmate=raw:')
    expect(shared).toEqual(payload)
  })

  it('ignores invalid or unrelated URL fragments', async () => {
    await expect(readSharedItinerary('#section')).resolves.toBeNull()
    await expect(readSharedItinerary('#tripmate=gz:invalid')).resolves.toBeNull()
  })
})
