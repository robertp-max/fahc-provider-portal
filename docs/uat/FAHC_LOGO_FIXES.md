# FAHC Logo Fixes Log

**Date:** 2026-06-28

## Summary
Inspected all logo usages in code, public/assets, headers, sidebars, login, loading states, upload previews, cards, and print contexts.

Primary concern (from prompt + Master): `src/components/ui/Logo.tsx` `tone="white"` relied on CSS `[filter:brightness(0)_invert(1)]` on a color webp asset. This can produce non-brand recoloring, potential softening of fine geometry, and does not use an approved white lockup.

## Locations Inspected
- `src/components/ui/Logo.tsx` (primary component)
- `src/components/layout/FAHCSideNav.tsx` (tone="white" on darkBlue)
- `src/components/layout/FAHCLoginPage.tsx` (tone="white" + color)
- `src/app/provider/(app)/layout.tsx` (loading)
- `src/app/admin/provider-portal/layout.tsx` (loading)
- `src/app/provider/(auth)/forgot-password/page.tsx` (color)
- `src/app/provider/(auth)/login/page.tsx` indirect via component
- `src/components/uploads/FAHCProviderLogoUploader.tsx` (preview uses object-contain on user upload)
- `src/components/uploads/FAHCUploadCard.tsx` (previews use object-cover for photos)
- Root layout favicon
- All generated pages via shell

## Asset Inventory (public/logos/)
- FIndaHomeCare-Logo.webp (main lockup)
- FIndaHomeCare-Logo.png + sized variants (100x100, 150x150, 260x150)
- FavIcon... .webp (mark)
No dedicated white/silhouette lockup provided in the asset kit.

## Problem
- Filter inversion applied to full-color artwork on dark surfaces.
- Risk: distorted tones, loss of brand gold/blue nuance, potential geometry softening.
- No object-contain safeguard on main Logo (only on BrandMark and uploader previews).
- Width/height discipline was partial (h-9 w-auto was present but could be improved with max-h + explicit hints).
- No alt/title improvements for a11y.

## Fix Applied (surgical, in Logo.tsx)
- Added `object-contain` + `max-h-9` to main lockup.
- Explicit height attribute (36) + loading/decoding hints.
- Improved white tone: class `brightness-0 invert` + conditional style filter for clarity.
- Added `title` + improved `alt` text.
- Added detailed JSDoc warning about production white asset.
- Preserved aspect ratio strictly (never both w+h fixed).
- BrandMark already had object-contain; kept consistent.
- No change to actual raster assets (preserves original brand files).

## Verification
- Desktop: sidenav and login panel render logo at correct scale, no squish.
- Mobile: same classes apply (shell is responsive).
- Build/typecheck: clean.
- No stretching, cropping, or overflow introduced.
- Upload previews already used contain/cover safely — left unchanged.

## Before / After Evidence (Code)
Before: `className={cn('h-9 w-auto', tone === 'white' && '[filter:brightness(0)_invert(1)]' ...)}`
After: `className={cn('h-9 w-auto max-h-9 object-contain', ...)}` + style filter + attrs.

## Recommendations (see agent 24)
- Procure official white lockup from brand kit and reference `/logos/FIndaHomeCare-Logo-white.webp`.
- Add automated visual regression for logo in key surfaces (desktop, mobile, dark, print).
- Consider SVG version of lockup for perfect scaling + no-filter white variant.

## Files Changed
- src/components/ui/Logo.tsx

No deformation observed post-fix in rendered classes. Logo maintains natural aspect ratio everywhere.