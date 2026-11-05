import { Printer } from 'lucide-react'
import appContent from '../../appContent.json'
import type { ItineraryActionsProps } from './ItineraryActions.types'

export default function ItineraryActions({ onPrint }: ItineraryActionsProps) {
  const content = appContent.itineraryActions

  return (
    <div className="itinerary-actions print-hidden">
      <button type="button" onClick={onPrint}>
        <Printer size={16} /> {content.print}
      </button>
    </div>
  )
}
