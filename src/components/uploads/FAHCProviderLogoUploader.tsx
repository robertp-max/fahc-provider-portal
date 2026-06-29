'use client'

import { useEffect, useRef, useState } from 'react'
import type { ProviderUser } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { IconUpload, IconTrash, IconBuilding } from '@/components/ui/icons'
import { formatBytes } from '@/lib/utils'

interface Props {
  viewer: ProviderUser
  agencyId: string
  initialName?: string
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']

/** Upload / preview / clear an agency logo (mock — no real upload). */
export function FAHCProviderLogoUploader({ viewer, agencyId, initialName }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(initialName ?? null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)
  previewRef.current = preview

  // Revoke any outstanding object URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!ALLOWED.includes(file.type)) {
      setError('Please choose a PNG, JPG, SVG, or WebP image.')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError(`Logo must be 2 MB or smaller (this file is ${formatBytes(file.size)}).`)
      return
    }

    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setFileName(file.name)
    logAudit({
      actor: viewer,
      action: 'logo_uploaded',
      objectType: 'Agency',
      objectId: agencyId,
      phiFlag: false,
      surface: 'provider',
      // Safe metadata only — no raw filename.
      metadata: { category: 'logo', mimeType: file.type, size: file.size },
    })
  }

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileName(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-brand-lightGray bg-brand-paleBlue/50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Agency logo preview" className="h-full w-full object-contain" />
          ) : (
            <IconBuilding className="h-9 w-9 text-brand-primary/30" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="fahc-btn-ghost border border-brand-softBlue py-2 text-xs"
            >
              <IconUpload className="h-4 w-4" /> {preview ? 'Replace logo' : 'Upload logo'}
            </button>
            {preview && (
              <button
                type="button"
                onClick={clear}
                className="fahc-btn-ghost py-2 text-xs text-rose-600 hover:bg-rose-50"
              >
                <IconTrash className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
          <p className="text-xs text-brand-charcoal/55">
            {fileName ? fileName : 'PNG, JPG, SVG or WebP · square · up to 2 MB.'}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED.join(',')}
            onChange={onFile}
            className="hidden"
            aria-label="Upload agency logo"
          />
        </div>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
