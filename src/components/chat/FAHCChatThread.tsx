'use client'

import { useEffect, useRef, useState } from 'react'
import type { SupportThread, ChatMessage } from '@/lib/types'
import { IconSend } from '@/components/ui/icons'
import { cn, formatTime, makeId } from '@/lib/utils'

interface Props {
  thread: SupportThread
  viewerName: string
}

const CANNED_REPLIES = [
  'Thanks for reaching out — let me look into that for you.',
  'Got it. A coordinator will follow up shortly with next steps.',
  'Happy to help! Is there anything else about this referral I can clarify?',
]

/** In-app message history UI (chat stub — no real websockets). */
export function FAHCChatThread({ thread, viewerName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(thread.messages)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const replyIdx = useRef(0)

  // Reset when the active thread changes.
  useEffect(() => {
    setMessages(thread.messages)
    setTyping(false)
  }, [thread.id, thread.messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    const msg: ChatMessage = {
      id: makeId('msg'),
      author: viewerName,
      authorRole: 'provider',
      body,
      sentAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, msg])
    setDraft('')

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
    <div className="flex h-[32rem] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-lightGray/70 px-5 py-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-brand-primary">{thread.subject}</h3>
          <p className="text-xs text-brand-charcoal/55">{thread.category}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Support online
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m) => {
          const mine = m.authorRole === 'provider'
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[78%]')}>
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
                <p
                  className={cn(
                    'mt-1 text-[11px] text-brand-charcoal/45',
                    mine ? 'text-right' : 'text-left',
                  )}
                >
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

      {/* Composer */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-brand-lightGray/70 px-4 py-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
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
