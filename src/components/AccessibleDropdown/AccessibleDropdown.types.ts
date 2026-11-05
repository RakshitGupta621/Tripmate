import type { ReactNode } from 'react'

export interface DropdownOption {
  value: string | number
  label: string
}

export interface AccessibleDropdownProps {
  value: string | number
  options: readonly DropdownOption[]
  onChange: (value: string | number) => void
  labelId: string
  icon?: ReactNode
  className?: string
}
