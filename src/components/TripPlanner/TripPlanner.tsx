import { ArrowDownUp, ArrowRight, Sparkles, Users, X } from 'lucide-react'
import type { CSSProperties, FormEvent } from 'react'
import CityAutocomplete from '../CityAutocomplete/CityAutocomplete'
import AccessibleDropdown from '../AccessibleDropdown/AccessibleDropdown'
import TripPreferences from '../TripPreferences/TripPreferences'
import { BUDGET_RANGE } from '../../constants/trip.js'
import { addDaysToDate, formatLocalDate, formatMoney } from '../../utils/trip.js'
import { fillText } from '../../utils/util_constants.js'
import appContent from '../../appContent.json'
import type { TripPlannerProps } from './TripPlanner.types'

export default function TripPlanner({
  form,
  loading,
  error,
  pickedCities,
  planTrip,
  update,
  updateTripStartDate,
  updateTripEndDate,
  swapCities,
  pickSource,
  pickDestination,
  dismissError,
  locationStatus,
  useCurrentLocation,
}: TripPlannerProps) {
  const content = appContent.planner
  function submit(event: FormEvent<HTMLFormElement>) {
    void planTrip(event)
  }

  return (
    <section className="planner-section" id="plan">
      <div className="section-heading">
        <div>
          <span className="section-kicker">{content.kicker}</span>
          <h2>{content.title}</h2>
        </div>
        <span className="step-pill">
          <span>{content.stepNumber}</span> {content.step}
        </span>
      </div>
      <form className="planner-card" onSubmit={submit}>
        <div className="route-fields">
          <div className="people-count">
            <span className="people-label" id="people-label">
              {content.people}
            </span>
            <AccessibleDropdown
              labelId="people-label"
              value={form.people}
              options={Array.from({ length: 12 }, (_, index) => ({
                value: index + 1,
                label: `${index + 1} ${index === 0 ? content.person : content.peoplePlural}`,
              }))}
              onChange={(value) => update('people', Number(value))}
              icon={<Users size={16} />}
            />
          </div>
          <CityAutocomplete
            id="source"
            label={content.source}
            value={form.source}
            selectedValue={pickedCities.source?.query === form.source ? form.source : ''}
            onChange={(value) => update('source', value)}
            onPick={pickSource}
            placeholder={content.sourcePlaceholder}
            locationStatus={locationStatus}
            onUseLocation={useCurrentLocation}
          />
          <button
            className="swap-button"
            type="button"
            aria-label={content.swapCities}
            onClick={swapCities}
          >
            <ArrowDownUp size={17} />
          </button>
          <CityAutocomplete
            id="destination"
            className="destination-field"
            label={content.destination}
            value={form.destination}
            selectedValue={
              pickedCities.destination?.query === form.destination ? form.destination : ''
            }
            onChange={(value) => update('destination', value)}
            onPick={pickDestination}
            placeholder={content.destinationPlaceholder}
          />
        </div>
        <div className="trip-options">
          <label className="trip-date-field" htmlFor="departure-date">
            <span>{content.departure}</span>
            <input
              id="departure-date"
              type="date"
              min={formatLocalDate()}
              value={form.startDate}
              onChange={(event) => updateTripStartDate(event.target.value)}
              required
            />
          </label>
          <label className="trip-date-field" htmlFor="return-date">
            <span>{content.return}</span>
            <input
              id="return-date"
              type="date"
              min={form.startDate || formatLocalDate()}
              max={form.startDate ? addDaysToDate(form.startDate, 9) : undefined}
              value={form.endDate}
              onChange={(event) => updateTripEndDate(event.target.value)}
              disabled={!form.startDate}
              required
            />
          </label>
          <div className="trip-departure">
            <span className="trip-date-label" id="departure-period-label">
              {content.departAround}
            </span>
            <AccessibleDropdown
              labelId="departure-period-label"
              value={form.departurePeriod}
              options={appContent.preferences.timePeriods}
              onChange={(value) => update('departurePeriod', value)}
            />
          </div>
          <div className="trip-arrival">
            <span className="trip-date-label" id="arrival-period-label">
              {content.arriveAround}
            </span>
            <AccessibleDropdown
              labelId="arrival-period-label"
              value={form.arrivalPeriod}
              options={appContent.preferences.timePeriods}
              onChange={(value) => update('arrivalPeriod', value)}
            />
          </div>
          <small className="trip-date-help">
            {form.endDate
              ? fillText(content.tripLength, {
                  days: form.days,
                  unit: form.days === 1 ? 'day' : 'days',
                })
              : content.datesHelp}
          </small>
        </div>
        <div className="form-budget">
          <label htmlFor="budget">{content.budget}</label>
          <div className="budget-slider-head">
            <span className="budget-currency">{content.currency}</span>
            <output htmlFor="budget">{formatMoney(form.budget)}</output>
          </div>
          <input
            className="budget-slider"
            id="budget"
            name="budget"
            type="range"
            aria-label={content.budgetAria}
            min={BUDGET_RANGE.min}
            max={BUDGET_RANGE.max}
            step={BUDGET_RANGE.step}
            value={form.budget}
            aria-valuetext={formatMoney(form.budget)}
            disabled={!form.includeBudget}
            style={
              {
                '--slider-fill': `${((form.budget - BUDGET_RANGE.min) / (BUDGET_RANGE.max - BUDGET_RANGE.min)) * 100}%`,
              } as CSSProperties
            }
            onChange={(event) => update('budget', Number(event.target.value))}
          />
          <div className="budget-slider-foot">
            <span>{formatMoney(BUDGET_RANGE.min)}</span>
            <label className="budget-toggle">
              <input
                type="checkbox"
                aria-label={content.includeBudget}
                checked={form.includeBudget}
                onChange={(event) => update('includeBudget', event.target.checked)}
              />
              <span>{content.include}</span>
            </label>
            <span>{formatMoney(BUDGET_RANGE.max)}</span>
          </div>
        </div>
        <TripPreferences form={form} update={update} />
        <div className="planner-actions">
          <div className="form-footnote">
            <Sparkles size={14} /> {content.noAccounts}
          </div>
          <button className="plan-button" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> {content.loading}
              </>
            ) : (
              <>
                {content.buildTrip} <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </form>
      {error && (
        <div className="error-panel" role="alert">
          <span className="error-symbol">!</span>
          <div>
            <b>{content.errorTitle}</b>
            <p>{error}</p>
          </div>
          <button
            className="dismiss-error"
            onClick={dismissError}
            aria-label={content.dismissError}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </section>
  )
}
