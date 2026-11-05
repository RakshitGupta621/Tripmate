import { ArrowRight, Compass, MapPin, Moon, Sparkles, Sun } from 'lucide-react'
import HeroSection from '../HeroSection/HeroSection'
import TripPlanner from '../TripPlanner/TripPlanner'
import TripResults from '../TripResults/TripResults'
import type { AppContentProps } from './AppContent.types'
import appContent from '../../appContent.json'
import { fillText } from '../../utils/util_constants.js'

export default function AppContent({ state, actions, resultsRef }: AppContentProps) {
  const content = appContent.navigation
  const howContent = appContent.howItWorks
  return (
    <main className="page-shell" data-theme={state.theme} data-focus-mode={state.focusMode}>
      <header className="topbar">
        <a className="brand" href="#home" aria-label={content.homeLabel}>
          <span className="brand-mark">
            <Compass size={19} strokeWidth={2.2} />
          </span>
          tripmate<span className="brand-period">.</span>
        </a>
        <nav className="top-nav" aria-label={content.mainNavigation}>
          <a className="active" href="#plan">
            {content.plan}
          </a>
          <a href="#how">{content.howItWorks}</a>
        </nav>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={actions.toggleTheme}
            aria-label={fillText(content.switchMode, {
              mode: state.theme === 'dark' ? content.modeLight : content.modeDark,
            })}
            aria-pressed={state.theme === 'dark'}
            title={fillText(content.switchMode, {
              mode: state.theme === 'dark' ? content.modeLight : content.modeDark,
            })}
          >
            {state.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            <span>{state.theme === 'dark' ? content.lightMode : content.darkMode}</span>
          </button>
          <a className="nav-cta" href="#plan">
            {content.startExploring} <ArrowRight size={15} />
          </a>
        </div>
      </header>

      <HeroSection />
      <TripPlanner
        form={state.form}
        loading={state.loading}
        locationStatus={state.locationStatus}
        useCurrentLocation={actions.useCurrentLocation}
        error={state.error}
        pickedCities={state.pickedCities}
        planTrip={actions.planTrip}
        update={actions.update}
        updateTripStartDate={actions.updateTripStartDate}
        updateTripEndDate={actions.updateTripEndDate}
        swapCities={actions.swapCities}
        pickSource={actions.pickSource}
        pickDestination={actions.pickDestination}
        dismissError={actions.dismissError}
      />
      <TripResults state={state} actions={actions} resultsRef={resultsRef} />

      {!state.trip && <HowItWorks content={howContent} />}
      <footer>
        <a className="brand footer-brand" href="#home">
          <span className="brand-mark">
            <Compass size={17} />
          </span>
          tripmate<span className="brand-period">.</span>
        </a>
        <span>{appContent.footer.tagline}</span>
        <span className="footer-credit">{appContent.footer.credit}</span>
      </footer>
    </main>
  )
}

function HowItWorks({ content }) {
  return (
    <section className="how-section" id="how">
      <div className="how-title">
        <span className="section-kicker">{content.kicker}</span>
        <h2>
          {content.titleFirst}
          <br />
          {content.titleSecond}
        </h2>
      </div>
      <div className="how-steps">
        {content.steps.map((step, index) => {
          const Icon = [MapPin, Sparkles, Compass][index]
          return (
            <div key={step.number}>
              <span>{step.number}</span>
              <Icon size={19} />
              <b>{step.title}</b>
              <p>{step.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
