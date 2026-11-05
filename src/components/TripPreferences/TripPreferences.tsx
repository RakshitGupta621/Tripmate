import AccessibleDropdown from '../AccessibleDropdown/AccessibleDropdown'
import appContent from '../../appContent.json'
import type { TripPreferencesProps } from './TripPreferences.types'

export default function TripPreferences({ form, update }: TripPreferencesProps) {
  const content = appContent.preferences
  function toggleInterest(value: string) {
    const current = form.interests
    update(
      'interests',
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  return (
    <details className="trip-preferences">
      <summary>
        <span>{appContent.planner.preferences}</span>
        <small>{appContent.planner.preferencesSummary}</small>
      </summary>
      <div className="preference-grid">
        <div className="preference-field">
          <label id="transport-to">{content.toCity}</label>
          <AccessibleDropdown
            labelId="transport-to"
            value={form.intercityTransport}
            options={content.intercityModes}
            onChange={(value) => update('intercityTransport', value)}
          />
        </div>
        <div className="preference-field">
          <label id="local-transport">{content.aroundCity}</label>
          <AccessibleDropdown
            labelId="local-transport"
            value={form.localTransport}
            options={content.localModes}
            onChange={(value) => update('localTransport', value)}
          />
        </div>
        <div className="preference-field">
          <label id="travel-style">{content.travelStyle}</label>
          <AccessibleDropdown
            labelId="travel-style"
            value={form.travelStyle}
            options={content.travelStyles}
            onChange={(value) => update('travelStyle', value)}
          />
        </div>
        <fieldset className="preference-field preference-wide">
          <legend>{content.interestsLegend}</legend>
          <div className="preference-chips">
            {content.interests.map((interest) => (
              <label className="preference-chip" key={interest}>
                <input
                  type="checkbox"
                  checked={form.interests.includes(interest)}
                  onChange={() => toggleInterest(interest)}
                />
                <span>{interest}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="preference-field preference-family">
          <label className="preference-checkbox">
            <input
              type="checkbox"
              checked={form.familyFriendly}
              onChange={(event) => update('familyFriendly', event.target.checked)}
            />
            <span>{content.familyFriendly}</span>
          </label>
        </div>
      </div>
    </details>
  )
}
