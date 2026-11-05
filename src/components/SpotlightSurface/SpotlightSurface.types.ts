import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react'

export interface SpotlightSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  className?: string
  children?: ReactNode
  style?: CSSProperties
}
