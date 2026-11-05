import { useEffect } from 'react'

export default function useClickOutside(ref, enabled, onOutside) {
  useEffect(() => {
    if (!enabled) return undefined
    // A global pointer listener lets clicks inside the listbox finish normally.
    const handlePointerDown = (event) => {
      if (!ref.current?.contains(event.target)) onOutside()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [enabled, onOutside, ref])
}
