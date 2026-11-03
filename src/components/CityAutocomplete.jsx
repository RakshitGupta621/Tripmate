import { useEffect, useId, useState } from 'react'
import { MapPin } from 'lucide-react'
import { suggestCities } from '../services/travel.js'

export default function CityAutocomplete({ id, className = '', label, value, onChange, onPick, placeholder }) {
  const listId = useId()
  const [suggestions, setSuggestions] = useState([])
  const [chosenValue, setChosenValue] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [searching, setSearching] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const query = value.trim()
    if (query.length < 2 || query === chosenValue) {
      setSuggestions([]); setOpen(false); setUnavailable(false); setSearching(false)
      return undefined
    }
    setSuggestions([]); setOpen(false)
    const controller = new AbortController()
    setSearching(true); setUnavailable(false)
    const timer = setTimeout(async () => {
      try {
        const cities = await suggestCities(query, controller.signal)
        if (controller.signal.aborted) return
        setSuggestions(cities); setOpen(true); setHighlighted(0)
      } catch (error) {
        if (controller.signal.aborted) return
        setSuggestions([]); setOpen(true); setUnavailable(true)
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [value, chosenValue])

  function choose(city) {
    setChosenValue(city.query)
    onChange(city.query)
    onPick?.(city)
    setSuggestions([]); setOpen(false); setUnavailable(false)
  }

  function handleKeyDown(event) {
    if (!open) return
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault(); setHighlighted((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault(); setHighlighted((current) => (current - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter' && suggestions.length) {
      event.preventDefault(); choose(suggestions[highlighted])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={`form-city city-autocomplete ${className} ${open ? 'suggestions-open' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <MapPin size={18} aria-hidden="true" />
        <input id={id} name={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-busy={searching} aria-controls={listId} aria-activedescendant={open && suggestions[highlighted] ? `${listId}-option-${highlighted}` : undefined} value={value} onChange={(event) => { setChosenValue(''); onPick?.(null); onChange(event.target.value) }} onKeyDown={handleKeyDown} onFocus={() => { if (suggestions.length) setOpen(true) }} placeholder={placeholder} autoComplete="off" required maxLength={80} />
        {searching && <span className="suggestion-spinner" aria-label="Searching cities" />}
      </div>
      {open && (suggestions.length > 0 || unavailable || (!searching && value.trim().length >= 2)) && <ul className="city-suggestions" id={listId} role="listbox" aria-label="City suggestions">
        {suggestions.map((city, index) => <li key={`${city.label}-${index}`} role="presentation"><button id={`${listId}-option-${index}`} className={highlighted === index ? 'highlighted' : ''} type="button" role="option" aria-selected={highlighted === index} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setHighlighted(index)} onClick={() => choose(city)}><span className="suggestion-pin"><MapPin size={14} /></span><span className="suggestion-copy"><b>{city.name}</b><small>{[city.state, city.country].filter(Boolean).join(', ')}</small></span></button></li>)}
        {unavailable && <li className="suggestion-message" role="status">Suggestions are unavailable right now. You can still enter a city.</li>}
        {!unavailable && suggestions.length === 0 && <li className="suggestion-message" role="status">No city matches yet. You can still enter it.</li>}
      </ul>}
    </div>
  )
}
