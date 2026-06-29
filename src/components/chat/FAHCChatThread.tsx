'use client'

import { useEffect, useRef, useState } from 'react'
import type { SupportThread, ChatMessage, ProviderUser } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { checkForPhi, PHI_INPUT_WARNING } from '@/lib/phi'
import { IconSend, IconUpload, IconClose, IconShield } from '@/components/ui/icons'
import { cn, formatBytes, formatTime, makeId } from '@/lib/utils'

interface Props {
  thread: SupportThread
  viewer: ProviderUser
}

type Availability = 'online' | 'away' | 'offline'

const CANNED_REPLIES = [
  'Thanks for reaching out — let me look into that for you.',
  'Got it. A coordinator will follow up shortly with next steps.',
  'Happy to help! Is there anything else about this referral I can clarify?',
]

const MAX_ATTACH_BYTES = 10 * 1024 * 1024
const ALLOWED_ATTACH = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

const AVAILABILITY_COPY: Record<Availability, { dot: string; label: string }> = {
  online: { dot: 'bg-emerald-500', label: 'Support online' },
  away: { dot: 'bg-amber-500', label: 'Support away — replies may be delayed' },
  offline: { dot: 'bg-brand-charcoal/40', label: 'Support offline — leave a message' },
}

/** In-app message history UI (chat stub — no real websockets). */
export function FAHCChatThread({ thread, viewer }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(thread.messages)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [phiError, setPhiError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<{ id: string; label: string; size: number }[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const replyIdx = useRef(0)

  // Prototype: support is shown as online.
  const availability: Availability = 'online'
  const avail = AVAILABILITY_COPY[availability]

  // Reset when the active thread changes.
  useEffect(() => {
    setMessages(thread.messages)
    setTyping(false)
    setAttachments([])
    setPhiError(null)
    setAttachError(null)
  }, [thread.id, thread.messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const onAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachError(null)
    if (!ALLOWED_ATTACH.includes(file.type)) {
      setAttachError('Unsupported file type.')
      return
    }
    if (file.size > MAX_ATTACH_BYTES) {
      setAttachError(`File must be ${formatBytes(MAX_ATTACH_BYTES)} or smaller.`)
      return
    }
    const label = `Attachment ${attachments.length + 1}`
    setAttachments((prev) => [...prev, { id: makeId('att'), label, size: file.size }])
    logAudit({
      actor: viewer,
      action: 'chat_attachment_added',
      objectType: 'SupportThread',
      objectId: thread.id,
      phiFlag: true,
      surface: 'provider',
      metadata: { category: file.type.startsWith('image/') ? 'image' : 'document', mimeType: file.type, size: file.size },
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body && attachments.length === 0) return

    // PHI guardrail — block sending if the message looks like it contains PHI.
    const phi = checkForPhi(body)
    if (phi.flagged) {
      setPhiError(`Your message looks like it contains ${phi.reason}. ${PHI_INPUT_WARNING}`)
      return
    }
    setPhiError(null)

    const attachNote =
      attachments.length > 0 ? ` (${attachments.length} attachment${attachments.length > 1 ? 's' : ''})` : ''
    const msg: ChatMessage = {
      id: makeId('msg'),
      author: viewer.name,
      authorRole: 'provider',
      body: body + attachNote,
      sentAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, msg])
    setDraft('')
    setAttachments([])

    // Simulate a support agent typing + replying.
    setTyping(true)
    const reply = CANNED_REPLIES[replyIdx.current % CANNED_REPLIES.length]
    replyIdx.current += 1
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: makeId('msg'),
          author: 'FindAHomeCare Support',
          authorRole: 'support',
          body: reply,
          sentAt: new Date().toISOString(),
        },
      ])
    }, 1400)
  }

  return (
    <div className="flex h-[34rem] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-lightGray/70 px-5 py-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-brand-primary">{thread.subject}</h3>
          <p className="text-xs text-brand-charcoal/55">{thread.category}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-charcoal/70">
          <span className={cn('h-2 w-2 rounded-full', avail.dot)} /> {avail.label}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m) => {
          const mine = m.authorRole === 'provider'
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className="max-w-[78%]">
                <div
                  className={cn(
                    'rounded-2xl px-3.5 py-2 text-sm',
                    mine
                      ? 'rounded-br-sm bg-brand-primary text-white'
                      : 'rounded-bl-sm bg-brand-paleBlue text-brand-charcoal',
                  )}
                >
                  {m.body}
                </div>
                <p className={cn('mt-1 text-[11px] text-brand-charcoal/45', mine ? 'text-right' : 'text-left')}>
                  {m.author} · {formatTime(m.sentAt)}
                </p>
              </div>
            </div>
          )
        })}
        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-brand-paleBlue px-4 py-3">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-primary/50"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PHI warning */}
      <div className="flex items-center gap-1.5 border-t border-brand-lightGray/70 bg-brand-softGold/30 px-4 py-1.5 text-[11px] text-brand-darkGold">
        <IconShield className="h-3.5 w-3.5 shrink-0" />
        Do not include client names, contact details, diagnoses, or other PHI in chat.
      </div>

      {/* Attachment chips */}
      {(attachments.length > 0 || attachError) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-2">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-paleBlue px-2 py-1 text-xs text-brand-primary"
            >
              {a.label} · {formatBytes(a.size)}
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                aria-label={`Remove ${a.label}`}
                className="text-brand-primary/60 hover:text-brand-primary"
              >
                <IconClose className="h-3 w-3" />
              </button>
            </span>
          ))}
          {attachError && <span className="text-xs text-rose-600">{attachError}</span>}
        </div>
      )}

      {phiError && <p className="px-4 pt-2 text-xs text-rose-600">{phiError}</p>}

      {/* Composer */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-brand-lightGray/70 px-4 py-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full p-2.5 text-brand-charcoal/60 hover:bg-brand-paleBlue"
          aria-label="Attach a file (mock)"
          title="Attach a file (mock — no upload)"
        >
          <IconUpload className="h-5 w-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ALLOWED_ATTACH.join(',')}
          onChange={onAttach}
          className="hidden"
          aria-label="Attach a file"
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            if (phiError) setPhiError(null)
          }}
          placeholder="Type a message…"
          className="fahc-input flex-1 rounded-full py-2.5"
          aria-label="Message"
        />
        <button type="submit" className="fahc-btn-primary rounded-full p-2.5" aria-label="Send message">
          <IconSend className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}
