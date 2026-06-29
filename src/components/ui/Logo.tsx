import { cn } from '@/lib/utils'

interface LogoProps {
  tone?: 'color' | 'white'
  className?: string
}

const LOGO_SRC = '/logos/FIndaHomeCare-Logo.webp'
const MARK_SRC = '/logos/FavIcon-Find-A-HomeCare-e1765429165523-260x257.webp'

/**
 * The FindAHomeCare brand lockup (real artwork from /public/logos).
 * On dark surfaces pass tone="white" to render the logo in solid white.
 */
export function Logo({ tone = 'color', className }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="FindAHomeCare"
      className={cn('h-9 w-auto', tone === 'white' && '[filter:brightness(0)_invert(1)]', className)}
    />
  )
}

/** Icon-only mark (the connected-care symbol). */
export function BrandMark({ tone = 'color', className }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MARK_SRC}
      alt="FindAHomeCare"
      className={cn('h-9 w-9 object-contain', tone === 'white' && '[filter:brightness(0)_invert(1)]', className)}
    />
  )
}
