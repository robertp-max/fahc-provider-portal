'use client'

import { useRef, useState } from 'react'
import type { ProviderUser } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { PhiWarning } from '@/components/ui/PhiBadge'
import { IconUpload, IconTrash } from '@/components/ui/icons'
import { formatBytes } from '@/lib/utils'

interface UploadedItem {
  id: string
  name: string
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

/** Generic file upload card with previews and clear/delete (mock — no real upload). */
export function FAHCUploadCard({
  viewer,
  agencyId,
  title = 'Photos & documents',
  phiWarning = true,
  accept = 'image/*,application/pdf',
}: Props) {
  const [items, setItems] = useState<UploadedItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const next: UploadedItem[] = files.map((f) => {
      const isImage = f.type.startsWith('image/')
      logAudit({
        actor: viewer,
        action: 'document_uploaded',
        objectType: 'DocumentFile',
        objectId: agencyId,
        phiFlag: phiWarning,
        metadata: { fileName: f.name, size: f.size, mimeType: f.type },
      })
      return {
        id: `${f.name}-${f.size}-${f.lastModified}`,
        name: f.name,
        size: f.size,
        url: isImage ? URL.createObjectURL(f) : undefined,
        isImage,
      }
    })
    setItems((prev) => [...prev, ...next])
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

      {phiWarning && <PhiWarning>Attachments may contain PHI. Upload only what is necessary; access is audited.</PhiWarning>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-brand-softBlue/70 bg-brand-paleBlue/30 px-4 py-8 text-center hover:border-brand-primary"
      >
        <IconUpload className="h-6 w-6 text-brand-primary" />
        <span className="text-sm font-medium text-brand-charcoal">Click to upload</span>
        <span className="text-xs text-brand-charcoal/55">Images or PDF</span>
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

      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it) => (
            <li key={it.id} className="group relative overflow-hidden rounded-xl border border-brand-lightGray">
              <div className="grid h-24 place-items-center bg-brand-paleBlue/50">
                {it.isImage && it.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt={it.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold uppercase text-brand-charcoal/50">PDF</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="truncate text-[11px] text-brand-charcoal/70" title={it.name}>
                  {it.name}
                </span>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="shrink-0 rounded p-1 text-rose-500 hover:bg-rose-50"
                  aria-label={`Remove ${it.name}`}
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
