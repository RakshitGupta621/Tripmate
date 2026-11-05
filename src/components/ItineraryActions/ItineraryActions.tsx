import { Printer } from 'lucide-react'
import appContent from '../../appContent.json'
import type { ItineraryActionsProps } from './ItineraryActions.types'

export default function ItineraryActions({ onPrint }: ItineraryActionsProps) {
  const content = appContent.itineraryActions

  return (
    <section className="itinerary-actions print-hidden" aria-label={content.print}>
      <button type="button" onClick={onPrint}>
        <Printer size={16} /> {content.print}
      </button>
    </section>
  )
}
