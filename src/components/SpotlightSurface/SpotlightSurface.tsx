import { useState, type PointerEvent, type CSSProperties } from 'react'
import type { SpotlightSurfaceProps } from './SpotlightSurface.types'

export default function SpotlightSurface({
  as: Element = 'div',
  className = '',
  children,
  style = {},
  ...props
}: SpotlightSurfaceProps) {
  const [pointer, setPointer] = useState(null)
  const spotlightStyle = {
    '--spotlight-x': pointer?.x || '50%',
    '--spotlight-y': pointer?.y || '50%',
    '--spotlight-opacity': pointer ? 1 : 0,
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
    const bounds = event.currentTarget.getBoundingClientRect()
    setPointer({ x: `${event.clientX - bounds.left}px`, y: `${event.clientY - bounds.top}px` })
  }

  return (
    <Element
      {...props}
      className={`spotlight-surface ${className}`.trim()}
      style={{ ...style, ...spotlightStyle } as CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setPointer(null)}
    >
      {children}
    </Element>
  )
}
