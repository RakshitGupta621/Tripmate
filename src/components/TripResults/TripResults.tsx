import { ArrowRight, Check, ChevronDown, Clock3, MapPin, Sparkles, TrainFront } from 'lucide-react'
import BudgetBreakdown from '../BudgetBreakdown/BudgetBreakdown'
import ItineraryActions from '../ItineraryActions/ItineraryActions'
import SpotlightSurface from '../SpotlightSurface/SpotlightSurface'
import TripMap from '../TripMap/TripMap'
import { fillText } from '../../utils/util_constants.js'
import appContent from '../../appContent.json'
import type { TripResultsProps } from './TripResults.types'

export default function TripResults({ state, actions, resultsRef }: TripResultsProps) {
  const content = appContent.results
  const {
    form,
    trip,
    tripForm,
    expandedDay,
    budgetAllocation,
    places,
    activityPins,
    dayRoutes,
    wiki,
    personalizationLabels,
    error,
  } = state
  return (
    <>
      {trip && (
        <section
          className="results-section"
          ref={resultsRef}
          tabIndex={-1}
          aria-labelledby="results-title"
        >
          <div className="result-heading">
            <div>
              <span className="section-kicker">{content.sectionKicker}</span>
              <h2 id="results-title">
                {trip.title ||
                  fillText(content.fallbackTitle, {
                    days: trip.days.length,
                    city: form.destination,
                  })}
              </h2>
              <p>{trip.overview}</p>
              {personalizationLabels.length > 0 && (
                <div className="personalization-summary" aria-label={content.preferencesAria}>
                  <Sparkles size={14} />
                  <span>{content.madeFor}</span>
                  {personalizationLabels.map((label) => (
                    <span className="personalization-tag" key={label}>
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="ready-badge">
              <Check size={14} /> {content.ready}
            </span>
          </div>
          <div className="results-grid">
            <div className="left-results">
              <SpotlightSurface className="travel-card">
                <div className="travel-icon">
                  <TrainFront size={20} />
                </div>
                <div className="travel-copy">
                  <span className="meta-label">
                    {fillText(content.gettingToCity, {
                      city: form.destination.toLocaleUpperCase(),
                    })}
                  </span>
                  <b>{trip.travel?.mode || content.recommendedRoute}</b>
                  <p>
                    {trip.travel?.note ||
                      fillText(content.routeFallback, {
                        source: form.source,
                        destination: form.destination,
                      })}
                  </p>
                  {(trip.travel?.departureWindow || trip.travel?.arrivalWindow) && (
                    <div className="travel-times">
                      <span>
                        {content.depart}{' '}
                        <b>{trip.travel?.departureWindow || content.checkSchedule}</b>
                      </span>
                      <span>
                        {content.arrive} <b>{trip.travel?.arrivalWindow || content.estimated}</b>
                      </span>
                    </div>
                  )}
                  <small className="travel-disclaimer">{content.travelDisclaimer}</small>
                </div>
                <span className="transport-divider" aria-hidden="true" />
                <div className="travel-copy local-travel-copy">
                  <span className="meta-label">{content.gettingAround}</span>
                  <b>
                    {trip.travel?.localMode ||
                      appContent.preferences.localModeLabels[(tripForm || form).localTransport]}
                  </b>
                  <p>
                    {trip.travel?.localNote ||
                      `${content.travelStyleLabel} ${(tripForm || form).travelStyle}.`}
                  </p>
                </div>
              </SpotlightSurface>
              <SpotlightSurface className="itinerary-card">
                <div className="card-heading">
                  <span className="meta-label">{content.dayByDay}</span>
                  <span className="trip-length">
                    <Clock3 size={13} />
                    {fillText(content.daysCount, { count: trip.days.length })}
                  </span>
                </div>
                {trip.days.map((day) => (
                  <article
                    className={`day-row ${expandedDay === day.day ? 'expanded' : ''}`}
                    key={day.day}
                  >
                    <button
                      className="day-toggle"
                      type="button"
                      onClick={() => actions.toggleDay(day.day)}
                      aria-expanded={expandedDay === day.day}
                    >
                      <span className="day-number">{String(day.day).padStart(2, '0')}</span>
                      <span className="day-title">
                        <small>{fillText(content.dayLabel, { day: day.day })}</small>
                        <b>
                          {day.theme ||
                            fillText(content.dayThemeFallback, { city: form.destination })}
                        </b>
                      </span>
                      <ChevronDown size={17} className="day-chevron" />
                    </button>
                    <div className="activities" hidden={expandedDay !== day.day}>
                      {day.activities.map((activity, index) => (
                        <div className="activity" key={`${activity.time}-${index}`}>
                          <span className="activity-time">
                            {activity.time}
                            {activity.duration && <small>{activity.duration}</small>}
                          </span>
                          <div>
                            {activity.area && (
                              <span className="activity-area">{activity.area}</span>
                            )}
                            <b>{activity.title}</b>
                            <p>{activity.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </SpotlightSurface>
            </div>
            <aside className="right-results">
              <BudgetBreakdown allocation={budgetAllocation} />
              <SpotlightSurface className="map-card">
                <div className="map-card-heading">
                  <span className="meta-label">{content.destinationCity}</span>
                  <span>
                    <MapPin size={15} />
                  </span>
                </div>
                <TripMap
                  destination={places.destination || null}
                  activityPins={activityPins}
                  dayRoutes={Object.values(dayRoutes)}
                />
                <div className="map-destination-label">
                  <MapPin size={14} />
                  {places.destination?.name || form.destination}
                </div>
                <p className="map-disclaimer">{content.mapDisclaimer}</p>
              </SpotlightSurface>
              {wiki && <WikipediaCard wiki={wiki} />}
            </aside>
          </div>
          <ItineraryActions onPrint={() => window.print()} />
        </section>
      )}
      {!trip && (wiki || (error && form.destination && form.startDate && form.endDate)) && (
        <section className="results-section destination-snapshot" aria-labelledby="snapshot-title">
          <div className="result-heading">
            <div>
              <span className="section-kicker">{content.snapshotKicker}</span>
              <h2 id="snapshot-title">
                {fillText(content.snapshotTitle, { city: form.destination })}
              </h2>
              <p>{content.snapshotDescription}</p>
            </div>
          </div>
          <div className="destination-snapshot-details">
            <BudgetBreakdown allocation={budgetAllocation} />
            {wiki && <WikipediaCard wiki={wiki} />}
          </div>
        </section>
      )}
    </>
  )
}

function WikipediaCard({ wiki }: { wiki: NonNullable<TripResultsProps['state']['wiki']> }) {
  const content = appContent.results
  return (
    <SpotlightSurface className="wiki-card">
      <div className="wiki-heading">
        <span className="wiki-mark">{content.wikiMark}</span>
        <span className="meta-label">{content.localContext}</span>
      </div>
      <h3>{wiki.title}</h3>
      <p>{wiki.extract}</p>
      <a href={wiki.url} target="_blank" rel="noreferrer">
        {content.wikipediaLink} <ArrowRight size={14} />
      </a>
    </SpotlightSurface>
  )
}
