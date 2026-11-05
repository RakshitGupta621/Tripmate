import { useEffect, useState } from 'react'
import { Printer, Share2 } from 'lucide-react'
import appContent from '../../appContent.json'
import { createItineraryShareUrl } from '../../utils/shareItinerary.js'
import type { ItineraryActionsProps } from './ItineraryActions.types'

export default function ItineraryActions({ title, data }: ItineraryActionsProps) {
  const content = appContent.itineraryActions
  const [shareUrl, setShareUrl] = useState('')
  const [message, setMessage] = useState(content.preparing)

  useEffect(() => {
    let active = true
    createItineraryShareUrl(data)
      .then((url) => {
        if (!active) return
        setShareUrl(url)
        setMessage('')
      })
      .catch(() => {
        if (active) setMessage(content.shareFailed)
      })
    return () => {
      active = false
    }
  }, [content.shareFailed, data])

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setMessage(content.copied)
    } catch {
      setMessage(content.copyFailed)
    }
  }

  async function share() {
    if (!shareUrl) return
    if (!navigator.share) {
      await copyLink()
      return
    }
    try {
      await navigator.share({ title, text: content.nativeShareTitle, url: shareUrl })
      setMessage('')
    } catch (error) {
      if (error.name !== 'AbortError') setMessage(content.shareFailed)
    }
  }

  return (
    <section className="itinerary-actions print-hidden" aria-label={content.nativeShareTitle}>
      <div className="itinerary-actions-copy">
        <b>{content.share}</b>
        <p>{content.shareDescription}</p>
      </div>
      <div className="itinerary-actions-buttons">
        <button type="button" onClick={() => window.print()}>
          <Printer size={16} /> {content.print}
        </button>
        <button type="button" onClick={share} disabled={!shareUrl}>
          <Share2 size={16} /> {content.share}
        </button>
      </div>
      <p className="share-status" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  )
}
