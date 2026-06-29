'use client'

import { useState } from 'react'
import { IconClose, IconPlus } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface TagFieldProps {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  suggestions?: string[]
  placeholder?: string
  disabled?: boolean
  hint?: string
}

/** Chip-style multi-value input with optional preset suggestions. */
export function TagField({
  label,
  values,
  onChange,
  suggestions = [],
  placeholder = 'Add and press Enter',
  disabled,
  hint,
}: TagFieldProps) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const v = raw.trim()
    if (!v || values.includes(v)) return
    onChange([...values, v])
    setDraft('')
  }
  const remove = (v: string) => onChange(values.filter((x) => x !== v))

  const remaining = suggestions.filter((s) => !values.includes(s))

  return (
    <div>
      <label className="fahc-label">{label}</label>
      <div
        className={cn(
          'flex flex-wrap gap-1.5 rounded-xl border border-brand-softBlue/70 bg-white p-2',
          disabled && 'bg-brand-lightGray',
        )}
      >
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-paleBlue px-2 py-1 text-xs font-medium text-brand-primary"
          >
            {v}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(v)}
                className="rounded text-brand-primary/60 hover:text-brand-primary"
                aria-label={`Remove ${v}`}
              >
                <IconClose className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add(draft)
              }
            }}
            placeholder={placeholder}
            className="flex-1 border-0 p-1 text-sm focus:ring-0"
          />
        )}
      </div>
      {remaining.length > 0 && !disabled && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-brand-softBlue px-2 py-0.5 text-xs text-brand-charcoal/70 hover:border-brand-primary hover:text-brand-primary"
            >
              <IconPlus className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-brand-charcoal/50">{hint}</p>}
    </div>
  )
}
