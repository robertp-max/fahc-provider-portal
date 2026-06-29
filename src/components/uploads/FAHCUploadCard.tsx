'use client'

import { useEffect, useRef, useState } from 'react'
import type { ProviderUser } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { PhiWarning } from '@/components/ui/PhiBadge'
import { IconUpload, IconTrash } from '@/components/ui/icons'
import { formatBytes } from '@/lib/utils'

interface UploadedItem {
  id: string
  label: string // redacted display label — never the raw filename
  size: number
  url?: string
  isImage: boolean
}

interface Props {
  viewer: ProviderUser
  agencyId: string
  title?: string
  /** Show the PHI attachment warning (e.g. for evidence documents). */
  phiWarning?: boolean
  accept?: string
}

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB per file
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

/** Generic file upload card with previews and clear/delete (mock — no real upload). */
export function FAHCUploadCard({
  viewer,
  agencyId,
  title = 'Photos & documents',
  phiWarning = true,
  accept = 'image/png,image/jpeg,image/webp,application/pdf',
}: Props) {
  const [items, setItems] = useState<UploadedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<UploadedItem[]>([])
  itemsRef.current = items

  // Revoke all outstanding object URLs on unmount.
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => i.url && URL.revokeObjectURL(i.url))
    }
  }, [])

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setError(null)

    const accepted: UploadedItem[] = []
    let imgCount = items.filter((i) => i.isImage).length
    let docCount = items.filter((i) => !i.isImage).length
    const rejected: string[] = []

    for (const f of files) {
      if (!ALLOWED.includes(f.type)) {
        rejected.push('unsupported type')
        continue
      }
      if (f.size > MAX_BYTES) {
        rejected.push(`over ${formatBytes(MAX_BYTES)}`)
        continue
      }
      const isImage = f.type.startsWith('image/')
      const label = isImage ? `Image ${++imgCount}` : `Document ${++docCount}`
      logAudit({
        actor: viewer,
        action: 'document_uploaded',
        objectType: 'DocumentFile',
        objectId: agencyId,
        phiFlag: phiWarning,
        surface: 'provider',
        // Safe metadata only — no raw filename (may contain PHI).
        metadata: { category: isImage ? 'image' : 'document', mimeType: f.type, size: f.size },
      })
      accepted.push({
        id: `${label}-${f.size}-${f.lastModified}`,
        label,
        size: f.size,
        url: isImage ? URL.createObjectURL(f) : undefined,
        isImage,
      })
    }

    if (rejected.length) setError(`${rejected.length} file(s) skipped (${rejected.join(', ')}).`)
    if (accepted.length) setItems((prev) => [...prev, ...accepted])
    if (inputRef.current) inputRef.current.value = ''
  }

  const remove = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target?.url) URL.revokeObjectURL(target.url)
      return prev.filter((i) => i.id !== id)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-sm font-semibold text-brand-primary">{title}</h4>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="fahc-btn-ghost border border-brand-softBlue py-2 text-xs"
        >
          <IconUpload className="h-4 w-4" /> Add files
        </button>
      </div>

      {phiWarning && (
        <PhiWarning>
          Attachments may contain PHI. Upload only what is necessary; filenames are redacted and
          access is audited.
        </PhiWarning>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-brand-softBlue/70 bg-brand-paleBlue/30 px-4 py-8 text-center hover:border-brand-primary"
      >
        <IconUpload className="h-6 w-6 text-brand-primary" />
        <span className="text-sm font-medium text-brand-charcoal">Click to upload</span>
        <span className="text-xs text-brand-charcoal/55">PNG, JPG, WebP or PDF · up to 10 MB each</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={onFiles}
        className="hidden"
        aria-label="Upload files"
      />

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it) => (
            <li key={it.id} className="group relative overflow-hidden rounded-xl border border-brand-lightGray">
              <div className="grid h-24 place-items-center bg-brand-paleBlue/50">
                {it.isImage && it.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt={it.label} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold uppercase text-brand-charcoal/50">PDF</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="truncate text-[11px] text-brand-charcoal/70">{it.label}</span>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="shrink-0 rounded p-1 text-rose-500 hover:bg-rose-50"
                  aria-label={`Remove ${it.label}`}
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="absolute right-1 top-1 rounded bg-black/50 px-1 text-[10px] text-white">
                {formatBytes(it.size)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
