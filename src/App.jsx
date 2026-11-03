import { useEffect, useRef, useState } from 'react'
import { ArrowDownUp, ArrowRight, BedDouble, Bus, CalendarDays, Check, ChevronDown, Clock3, Compass, MapPin, Moon, ShoppingBag, Sparkles, Sun, TrainFront, Utensils, Users, Wallet, X } from 'lucide-react'
import { geocodeCity, geocodeItineraryPlaces, getNearbyCities, getWikipedia, requestItinerary } from './services/travel.js'
import CityAutocomplete from './components/CityAutocomplete.jsx'
import TripMap from './components/TripMap.jsx'

const BUDGET_RANGE = { min: 5_000, max: 500_000, step: 5_000 }
const initialForm = { source: '', destination: '', days: 3, people: 1, budget: 30_000, includeBudget: true }
const budgetIcons = { Travel: Bus, Stay: BedDouble, Food: Utensils, Shopping: ShoppingBag, Activities: Sparkles }

function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount)
}

function BudgetBreakdown({ allocation }) {
  if (!allocation) return null
  return <section className="budget-card" aria-label="Budget allocation">
    <div className="budget-card-heading"><span className="budget-card-icon"><Wallet size={18} /></span><div><span className="meta-label">YOUR BUDGET PLAN</span><h3>{formatMoney(allocation.total)} <small>total</small></h3></div></div>
    <p className="budget-caption">{formatMoney(allocation.perPerson)} per person · {allocation.people} {allocation.people === 1 ? 'traveler' : 'travelers'}. Adjust the split as plans change.</p>
    <div className="budget-rows">{allocation.categories.map((item) => {
      const Icon = budgetIcons[item.category] || Sparkles
      return <div className="budget-row" key={item.category}><span className={`budget-category-icon budget-${item.category.toLowerCase()}`}><Icon size={15} /></span><span className="budget-category-name">{item.category}<small>{item.percent}%</small></span><span className="budget-track"><span style={{ width: `${item.percent}%` }} /></span><b>{formatMoney(item.amount)}</b></div>
    })}</div>
  </section>
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('tripmate-theme') === 'dark' ? 'dark' : 'light' }
    catch { return 'light' }
  })
  const [form, setForm] = useState(initialForm)
  const [trip, setTrip] = useState(null)
  const [places, setPlaces] = useState({ source: null, destination: null })
  const [pickedCities, setPickedCities] = useState({ source: null, destination: null })
  const [wiki, setWiki] = useState(null)
  const [nearby, setNearby] = useState([])
  const [activityPins, setActivityPins] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedDay, setExpandedDay] = useState(1)
  const controllerRef = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('tripmate-theme', theme) } catch { /* Theme still works for this visit. */ }
  }, [theme])

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })) }

  async function planTrip(event) {
    event.preventDefault()
    setError(''); setTrip(null); setWiki(null); setNearby([]); setActivityPins([]); setLoading(true)
    controllerRef.current?.abort()
    const controller = new AbortController(); controllerRef.current = controller
    try {
      const sourceRequest = pickedCities.source?.query === form.source ? Promise.resolve(pickedCities.source) : geocodeCity(form.source, controller.signal)
      const destinationRequest = pickedCities.destination?.query === form.destination ? Promise.resolve(pickedCities.destination) : geocodeCity(form.destination, controller.signal)
      const [source, destination] = await Promise.all([sourceRequest, destinationRequest])
      setPlaces({ source, destination })
      const budget = form.includeBudget ? { amount: Number(form.budget), currency: 'INR' } : null
      const [itineraryResult, wikiResult] = await Promise.allSettled([
        requestItinerary({ source: form.source, destination: form.destination, days: form.days, people: form.people, budget }, controller.signal), getWikipedia(form.destination, controller.signal),
      ])
      if (wikiResult.status === 'fulfilled') setWiki(wikiResult.value)
      if (itineraryResult.status === 'fulfilled') {
        const itinerary = itineraryResult.value
        setTrip(itinerary); setExpandedDay(1)
        const activities = itinerary.days.flatMap((day) => day.activities.map((activity) => ({ ...activity, day: day.day })))
        geocodeItineraryPlaces(activities, destination, controller.signal)
          .then((pins) => { if (!controller.signal.aborted) setActivityPins(pins) })
          .catch(() => {})
      } else {
        setError(itineraryResult.reason.message)
        try { setNearby(await getNearbyCities(destination, controller.signal)) } catch { setNearby([]) }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Something went wrong while searching for your cities.')
    } finally { setLoading(false) }
  }

  function useNearby(city) { update('destination', city); setPickedCities((current) => ({ ...current, destination: null })); setError(''); setNearby([]) }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="TripMate home"><span className="brand-mark"><Compass size={19} strokeWidth={2.2} /></span>tripmate<span className="brand-period">.</span></a>
        <nav className="top-nav" aria-label="Main navigation"><a className="active" href="#plan">Plan a trip</a><a href="#how">How it works</a></nav>
        <div className="nav-actions"><button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}<span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button><a className="nav-cta" href="#plan">Start exploring <ArrowRight size={15} /></a></div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-star">✳</span> YOUR NEXT GOOD STORY STARTS HERE</span>
          <h1>Go somewhere<br /><em>good.</em></h1>
          <p className="hero-intro">Thoughtful little getaways, planned around you. Tell us where you’re starting and we’ll take it from there.</p>
          <div className="hero-note"><span className="note-icon"><Sparkles size={16} /></span><span><b>Less planning, more looking forward.</b><br />Your trip, shaped into a day-by-day plan.</span></div>
          <div className="hero-stats"><span><b>✦</b> Made for real getaways</span><span><b>↗</b> Routes & local context</span></div>
        </div>
        <div className="hero-art" role="img" aria-label="Illustration of a sunny coastal destination">
          <div className="art-sun" /><div className="art-cloud cloud-one" /><div className="art-cloud cloud-two" />
          <div className="art-hill hill-back" /><div className="art-hill hill-front" />
          <div className="art-water" /><div className="art-road" />
          <div className="art-house"><div className="house-roof" /><div className="house-body"><span className="window" /><span className="door" /></div></div>
          <div className="art-tree tree-one"><i /><i /><i /><b /></div><div className="art-tree tree-two"><i /><i /><i /><b /></div>
          <div className="art-label"><span>✳</span><div>Take the scenic route<small>There’s no rush.</small></div></div>
          <div className="art-postcard">SLOW<br />MORNINGS <span>↗</span></div>
          <div className="art-coordinates">37° 58′ N&nbsp;&nbsp; 23° 43′ E</div>
        </div>
      </section>

      <section className="planner-section" id="plan">
        <div className="section-heading"><div><span className="section-kicker">LET’S MAKE A PLAN</span><h2>Where to next?</h2></div><span className="step-pill"><span>01</span> THE DETAILS</span></div>
        <form className="planner-card" onSubmit={planTrip}>
          <div className="route-fields">
            <CityAutocomplete id="source" label="STARTING FROM" value={form.source} onChange={(value) => update('source', value)} onPick={(city) => setPickedCities((current) => ({ ...current, source: city }))} placeholder="Your city" />
            <button className="swap-button" type="button" aria-label="Swap starting and destination cities" onClick={() => { setForm((current) => ({ ...current, source: current.destination, destination: current.source })); setPickedCities(({ source, destination }) => ({ source: destination, destination: source })) }}><ArrowDownUp size={17} /></button>
            <CityAutocomplete id="destination" className="destination-field" label="HEADING TO" value={form.destination} onChange={(value) => update('destination', value)} onPick={(city) => setPickedCities((current) => ({ ...current, destination: city }))} placeholder="A city you’re curious about" />
          </div>
          <div className="trip-options"><div className="form-days"><label htmlFor="days">HOW LONG?</label><div className="select-wrap"><CalendarDays size={16} /><select id="days" name="days" value={form.days} onChange={(e) => update('days', Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'day' : 'days'}</option>)}</select><ChevronDown size={14} /></div></div><div className="people-count"><label htmlFor="people">PEOPLE</label><div className="people-select-wrap"><Users size={15} /><select id="people" name="people" aria-label="People count" value={form.people} onChange={(event) => update('people', Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? 'person' : 'people'}</option>)}</select><ChevronDown size={14} /></div></div></div>
          <div className="form-budget"><label htmlFor="budget">TRIP BUDGET / PERSON</label><div className="budget-slider-head"><span className="budget-currency">₹ INR</span><output htmlFor="budget">{formatMoney(form.budget)}</output></div><input className="budget-slider" id="budget" name="budget" type="range" aria-label="Budget amount" min={BUDGET_RANGE.min} max={BUDGET_RANGE.max} step={BUDGET_RANGE.step} value={form.budget} aria-valuetext={formatMoney(form.budget)} disabled={!form.includeBudget} style={{ '--slider-fill': `${((form.budget - BUDGET_RANGE.min) / (BUDGET_RANGE.max - BUDGET_RANGE.min)) * 100}%` }} onChange={(event) => update('budget', Number(event.target.value))} /><div className="budget-slider-foot"><span>{formatMoney(BUDGET_RANGE.min)}</span><label className="budget-toggle"><input type="checkbox" aria-label="Include budget in itinerary" checked={form.includeBudget} onChange={(event) => update('includeBudget', event.target.checked)} /><span>Include</span></label><span>{formatMoney(BUDGET_RANGE.max)}</span></div></div>
          <button className="plan-button" type="submit" disabled={loading}>{loading ? <><span className="spinner" /> Finding your way...</> : <>Build my trip <ArrowRight size={17} /></>}</button>
          <div className="form-footnote"><Sparkles size={14} /> No accounts. No fuss. Just a good plan.</div>
        </form>
        {error && <div className="error-panel" role="alert"><span className="error-symbol">!</span><div><b>We hit a little bump.</b><p>{error}</p>{nearby.length > 0 && <div className="nearby"><span>Try somewhere close:</span>{nearby.map((place) => <button type="button" key={place.name} onClick={() => useNearby(place.name)}>{place.name} <ArrowRight size={13} /></button>)}</div>}</div><button className="dismiss-error" onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button></div>}
      </section>

      {trip && <section className="results-section" aria-live="polite">
        <div className="result-heading"><div><span className="section-kicker">YOUR LITTLE ESCAPE</span><h2>{trip.title || `${form.days} days in ${form.destination}`}</h2><p>{trip.overview}</p></div><span className="ready-badge"><Check size={14} /> READY TO GO</span></div>
        <div className="results-grid">
          <div className="left-results">
            <div className="travel-card"><div className="travel-icon"><TrainFront size={20} /></div><div><span className="meta-label">GETTING THERE</span><b>{trip.travel?.mode || 'Your journey'}</b><p>{trip.travel?.note || `${form.source} to ${form.destination}`}</p></div><div className="journey-line"><span /><i /><span /></div></div>
            <div className="itinerary-card"><div className="card-heading"><span className="meta-label">THE DAY-BY-DAY</span><span className="trip-length"><Clock3 size={13} /> {trip.days.length} days</span></div>
              {trip.days.map((day) => <article className={`day-row ${expandedDay === day.day ? 'expanded' : ''}`} key={day.day}>
                <button className="day-toggle" type="button" onClick={() => setExpandedDay(expandedDay === day.day ? 0 : day.day)} aria-expanded={expandedDay === day.day}><span className="day-number">{String(day.day).padStart(2, '0')}</span><span className="day-title"><small>DAY {day.day}</small><b>{day.theme || `A day in ${form.destination}`}</b></span><ChevronDown size={17} className="day-chevron" /></button>
                {expandedDay === day.day && <div className="activities">{day.activities.map((activity, i) => <div className="activity" key={`${activity.time}-${i}`}><span className="activity-time">{activity.time}{activity.duration && <small>{activity.duration}</small>}</span><div><b>{activity.title}</b><p>{activity.description}</p></div></div>)}</div>}
              </article>)}
            </div>
          </div>
          <aside className="right-results"><BudgetBreakdown allocation={trip.budgetAllocation} /><div className="map-card"><div className="map-card-heading"><span className="meta-label">DESTINATION CITY</span><span><MapPin size={15} /></span></div><TripMap destination={places.destination} activityPins={activityPins} /><div className="map-destination-label"><MapPin size={14} />{places.destination?.name || form.destination}</div><p className="map-disclaimer">Zoom and explore the map. {activityPins.length ? `${activityPins.length} itinerary ${activityPins.length === 1 ? 'place is' : 'places are'} pinned. Click a pin for details.` : 'Pins appear when itinerary places can be matched to the map.'}</p></div>
            {wiki && <div className="wiki-card"><div className="wiki-heading"><span className="wiki-mark">W</span><span className="meta-label">A LITTLE LOCAL CONTEXT</span></div><h3>{wiki.title}</h3><p>{wiki.extract}</p><a href={wiki.url} target="_blank" rel="noreferrer">A little more on Wikipedia <ArrowRight size={14} /></a></div>}
          </aside>
        </div>
      </section>}

      {!trip && <section className="how-section" id="how"><div className="how-title"><span className="section-kicker">SMALL INPUT, BIG DAYDREAM</span><h2>A trip takes shape<br />in three little steps.</h2></div><div className="how-steps"><div><span>01</span><MapPin size={19} /><b>Pick your places</b><p>Start with where you are and somewhere you’d like to be.</p></div><div><span>02</span><Sparkles size={19} /><b>We do the thinking</b><p>A thoughtful itinerary, made for the days you have.</p></div><div><span>03</span><Compass size={19} /><b>Find your way</b><p>Get the lay of the land, with a map and local context.</p></div></div></section>}

      <footer><a className="brand footer-brand" href="#home"><span className="brand-mark"><Compass size={17} /></span>tripmate<span className="brand-period">.</span></a><span>Made for the joy of going somewhere.</span><span className="footer-credit">Maps by OpenStreetMap · Context from Wikipedia</span></footer>
    </main>
  )
}
