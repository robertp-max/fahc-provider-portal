import { cn } from '@/lib/utils'

interface LogoProps {
  tone?: 'color' | 'white'
  className?: string
}

const COLOR_LOGO_SRC = '/logos/FindAHomeCare-logo-horizontal-color.png'
const WHITE_LOGO_SRC = '/logos/FindAHomeCare-logo-horizontal-white.png'
const COLOR_MARK_SRC = '/logos/FavIcon-Find-A-HomeCare-e1765429165523-260x257.webp'
const WHITE_MARK_SRC = '/logos/FindAHomeCare-mark-white.png'

/**
 * The FindAHomeCare brand lockup (real artwork from /public/logos).
 * CSS owns the rendered height so the horizontal lockup keeps its natural width.
 */
export function Logo({ tone = 'color', className }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === 'white' ? WHITE_LOGO_SRC : COLOR_LOGO_SRC}
      alt="Find A Home Care"
      title="Find A Home Care"
      className={cn(
        'h-10 w-auto object-contain',
        className
      )}
      loading="eager"
      decoding="async"
    />
  )
}

/** Icon-only mark (the connected-care symbol). */
export function BrandMark({ tone = 'color', className }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === 'white' ? WHITE_MARK_SRC : COLOR_MARK_SRC}
      alt="Find A Home Care mark"
      title="Find A Home Care"
      className={cn('h-9 w-9 object-contain', className)}
      loading="eager"
      decoding="async"
    />
  )
}
