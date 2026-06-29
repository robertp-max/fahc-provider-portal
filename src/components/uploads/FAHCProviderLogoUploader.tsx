'use client'

import { useRef, useState } from 'react'
import type { ProviderUser } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { IconUpload, IconTrash, IconBuilding } from '@/components/ui/icons'

interface Props {
  viewer: ProviderUser
  agencyId: string
  initialName?: string
}

/** Upload / preview / clear an agency logo (mock — no real upload). */
export function FAHCProviderLogoUploader({ viewer, agencyId, initialName }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(initialName ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setFileName(file.name)
    logAudit({
      actor: viewer,
      action: 'logo_uploaded',
      objectType: 'Agency',
      objectId: agencyId,
      phiFlag: false,
      metadata: { fileName: file.name, size: file.size },
    })
  }

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
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
          {fileName ? fileName : 'PNG or SVG, square, up to 2 MB.'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
          aria-label="Upload agency logo"
        />
      </div>
    </div>
  )
}
