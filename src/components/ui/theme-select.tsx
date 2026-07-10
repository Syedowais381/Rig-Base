'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type ThemeSelectOption = { value: string; label: string }

type ThemeSelectProps = {
  value: string
  onChange: (value: string) => void
  options: ThemeSelectOption[]
  'aria-label': string
  className?: string
  variant?: 'table' | 'form'
  placeholder?: string
}

export function ThemeSelect({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  className = '',
  variant = 'table',
  placeholder = 'Select…',
}: ThemeSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)
  const isForm = variant === 'form'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className={`relative ${isForm ? 'w-full' : ''} ${className}`.trim()}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={isForm ? 'form-select-trigger' : 'table-select-trigger'}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={`select-menu ${isForm ? 'select-menu-form' : ''}`}
        >
          {options.map((option) => {
            const isSelected = value === option.value
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`select-menu-item ${isForm ? 'select-menu-item-form' : ''} ${isSelected ? 'select-menu-item-active' : ''}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={14} className="shrink-0 text-accent" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
