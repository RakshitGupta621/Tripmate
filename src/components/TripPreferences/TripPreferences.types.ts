import type { TripForm } from '../../types/trip.types'

export interface TripPreferencesProps {
  form: Pick<
    TripForm,
    'travelStyle' | 'intercityTransport' | 'localTransport' | 'interests' | 'familyFriendly'
  >
  update: (field: keyof TripForm, value: unknown) => void
}
