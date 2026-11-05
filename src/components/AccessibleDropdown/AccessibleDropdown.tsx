import { useCallback, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside.js'
import type { AccessibleDropdownProps } from './AccessibleDropdown.types'

export default function AccessibleDropdown({
  value,
  options,
  onChange,
  labelId,
  icon = null,
  className = '',
}: AccessibleDropdownProps) {
  const uid = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => String(option.value) === String(value)),
  )
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const selected = options[selectedIndex]
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(rootRef, open, close)

  function moveActive(direction) {
    setOpen(true)
    setActiveIndex((current) => (current + direction + options.length) % options.length)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveActive(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) {
        onChange(options[activeIndex].value)
        setOpen(false)
      } else {
        setActiveIndex(selectedIndex)
        setOpen(true)
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className={`accessible-dropdown ${className}`} ref={rootRef}>
      <button
        type="button"
        className="accessible-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-listbox`}
        aria-labelledby={labelId}
        aria-activedescendant={open ? `${uid}-option-${activeIndex}` : undefined}
        onClick={() => {
          setActiveIndex(selectedIndex)
          setOpen((current) => !current)
        }}
        onKeyDown={handleKeyDown}
      >
        {icon && (
          <span className="accessible-dropdown-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="accessible-dropdown-value">{selected?.label ?? ''}</span>
        <ChevronDown className="accessible-dropdown-chevron" size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={`${uid}-listbox`}
          className="accessible-dropdown-list"
          role="listbox"
          aria-labelledby={labelId}
        >
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              id={`${uid}-option-${index}`}
              aria-selected={String(option.value) === String(value)}
              tabIndex={-1}
              className={index === activeIndex ? 'active' : ''}
              key={option.value}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
