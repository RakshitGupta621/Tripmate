import { useEffect, useId, useState } from 'react'
import { MapPin } from 'lucide-react'
import { suggestCities } from '../../services/travel.js'
import { SERVICE_MESSAGES } from '../../utils/util_constants.js'
import appContent from '../../appContent.json'
import type { CitySearchResult, CityAutocompleteProps } from './CityAutocomplete.types'

export default function CityAutocomplete({
  id,
  className = '',
  label,
  value,
  onChange,
  onPick,
  placeholder,
  selectedValue = '',
  locationStatus,
  onUseLocation,
}: CityAutocompleteProps) {
  const content = appContent.cityAutocomplete
  const listId = useId()
  const [searchResult, setSearchResult] = useState<CitySearchResult>({
    query: '',
    suggestions: [],
    status: 'idle',
  })
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const query = value.trim()
  const hasSearchQuery = query.length >= 2 && query !== selectedValue
  const isCurrentResult = searchResult.query === query
  const suggestions = isCurrentResult ? searchResult.suggestions : []
  const searching = hasSearchQuery && (!isCurrentResult || searchResult.status === 'loading')
  const unavailable = isCurrentResult && searchResult.status === 'unavailable'
  const locationMessage = {
    denied: content.locationDenied,
    unavailable: content.locationUnavailable,
    unsupported: content.locationUnsupported,
  }[locationStatus]

  useEffect(() => {
    if (!hasSearchQuery) return undefined

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSearchResult({ query, suggestions: [], status: 'loading' })
      try {
        const cities = await suggestCities(query, controller.signal)
        if (controller.signal.aborted) return
        setSearchResult({ query, suggestions: cities, status: 'ready' })
        setOpen(true)
        setHighlighted(0)
      } catch {
        if (controller.signal.aborted) return
        setSearchResult({ query, suggestions: [], status: 'unavailable' })
        setOpen(true)
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [hasSearchQuery, query])

  function choose(city) {
    onChange(city.query)
    onPick?.(city)
    setOpen(false)
  }

  function handleKeyDown(event) {
    if (!open) return
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault()
      setHighlighted((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault()
      setHighlighted((current) => (current - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter' && suggestions.length) {
      event.preventDefault()
      choose(suggestions[highlighted])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={`form-city city-autocomplete ${className} ${open ? 'suggestions-open' : ''}`}>
      <div className="city-field-label-row">
        <label htmlFor={id}>{label}</label>
        {onUseLocation && (
          <button
            type="button"
            className="city-location-button"
            onClick={onUseLocation}
            disabled={locationStatus === 'loading'}
            aria-describedby={`${id}-location-status`}
          >
            {locationStatus === 'loading'
              ? appContent.planner.findingLocation
              : appContent.planner.useLocation}
          </button>
        )}
      </div>
      <div className="input-wrap">
        <MapPin size={18} aria-hidden="true" />
        <input
          id={id}
          name={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-busy={searching}
          aria-controls={listId}
          aria-activedescendant={
            open && suggestions[highlighted] ? `${listId}-option-${highlighted}` : undefined
          }
          value={value}
          onChange={(event) => {
            onPick?.(null)
            onChange(event.target.value)
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length) setOpen(true)
          }}
          placeholder={placeholder}
          autoComplete="off"
          required
          maxLength={80}
        />
        {searching && <span className="suggestion-spinner" aria-label={content.searchingLabel} />}
      </div>
      {onUseLocation && locationMessage && (
        <p className="city-location-feedback" id={`${id}-location-status`} role="status">
          {locationMessage}
        </p>
      )}
      {open &&
        (suggestions.length > 0 || unavailable || (!searching && value.trim().length >= 2)) && (
          <ul
            className="city-suggestions"
            id={listId}
            role="listbox"
            aria-label={content.suggestionsLabel}
          >
            {suggestions.map((city, index) => (
              <li key={`${city.label}-${index}`} role="presentation">
                <button
                  id={`${listId}-option-${index}`}
                  className={highlighted === index ? 'highlighted' : ''}
                  type="button"
                  role="option"
                  aria-selected={highlighted === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => choose(city)}
                >
                  <span className="suggestion-pin">
                    <MapPin size={14} />
                  </span>
                  <span className="suggestion-copy">
                    <b>{city.name}</b>
                    <small>{[city.state, city.country].filter(Boolean).join(', ')}</small>
                  </span>
                </button>
              </li>
            ))}
            {unavailable && (
              <li className="suggestion-message" role="status">
                {SERVICE_MESSAGES.citySearchUnavailable}
              </li>
            )}
            {!unavailable && suggestions.length === 0 && (
              <li className="suggestion-message" role="status">
                {content.noMatches}
              </li>
            )}
          </ul>
        )}
    </div>
  )
}
