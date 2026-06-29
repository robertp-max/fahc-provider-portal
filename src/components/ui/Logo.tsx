import { cn } from '@/lib/utils'

interface LogoProps {
  tone?: 'color' | 'white'
  className?: string
}

const LOGO_SRC = '/logos/FIndaHomeCare-Logo.webp'
const MARK_SRC = '/logos/FavIcon-Find-A-HomeCare-e1765429165523-260x257.webp'

/**
 * The FindAHomeCare brand lockup (real artwork from /public/logos).
 * tone="white" applies an inversion filter for dark navs/login panels.
 * NOTE: For production use a brand-approved white variant asset to avoid any filter-induced
 * color shifts or geometry softening on complex artwork. Current approach preserves aspect via w-auto.
 * Never set both explicit width+height that would distort.
 */
export function Logo({ tone = 'color', className }: LogoProps) {
  const whiteFilter = tone === 'white' ? 'brightness(0) invert(1)' : undefined
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="Find A Home Care"
      title="Find A Home Care"
      width={undefined}
      height={36}
      className={cn(
        'h-9 w-auto max-h-9 object-contain',
        tone === 'white' && 'brightness-0 invert',
        className
      )}
      style={whiteFilter ? { filter: whiteFilter } : undefined}
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
      src={MARK_SRC}
      alt="Find A Home Care mark"
      title="Find A Home Care"
      className={cn('h-9 w-9 object-contain', tone === 'white' && 'brightness-0 invert', className)}
      loading="eager"
      decoding="async"
    />
  )
}
