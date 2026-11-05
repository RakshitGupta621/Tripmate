import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AccessibleDropdown from './AccessibleDropdown'

describe('AccessibleDropdown', () => {
  it('shows options and reports the selected value', () => {
    const onChange = vi.fn()
    render(
      <>
        <span id="people-label">People</span>
        <AccessibleDropdown
          labelId="people-label"
          value={1}
          options={[
            { value: 1, label: '1 person' },
            { value: 2, label: '2 people' },
          ]}
          onChange={onChange}
        />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'People' }))
    fireEvent.click(screen.getByRole('option', { name: '2 people' }))

    expect(onChange).toHaveBeenCalledWith(2)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
