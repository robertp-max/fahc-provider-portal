# FAHC UAT Baseline Report

**Timestamp:** 2026-06-28  
**Repo Path:** C:\AI\Git\Find_A_Home_Care_Portal  
**Branch:** main  
**Git Remote:** https://github.com/robertp-max/fahc-provider-portal.git  
**GitHub:** https://github.com/robertp-max/fahc-provider-portal  
**Production Vercel:** https://fahc-provider-portal.vercel.app  
**Framework:** Next.js 14 (App Router) + TypeScript + Tailwind + React 18 (strict, no `any` in app logic)  
**Package Manager:** npm (package-lock.json present)  

## Commands Executed (Baseline Discovery)

```bash
git branch --show-current          # main
git status --short                 # clean, working tree clean
git remote -v                      # origin https://github.com/robertp-max/fahc-provider-portal.git
git log --oneline -5               # 87cdce4 Ignore .vercel... ; 49a93e2 Initial commit
git status --porcelain --branch
npm run typecheck                  # PASS (exit 0, no errors)
npm run build                      # PASS (exit 0, all 18 routes generated, static + 1 dynamic)
```

No `npm test` or `npm run lint` scripts in package.json (see below).

## High-Level Implementation Map

- **Auth / Session:** Mock only in `src/lib/auth.tsx`. Auto-hydrates demo user (Sarah Intake, agency-101) on load unless explicitly logged out. Login accepts any non-empty creds. Role switcher in Settings for demo RBAC testing. No real Google/Firebase.
- **Data Layer:** `src/lib/api.ts` + `src/lib/mockData.ts`. Strict tenant isolation via `scope()` + `canAccessAllTenants()`. `getReferralById` 404s cross-tenant for providers.
- **Audit:** `src/lib/audit.ts` + `FAHCAuditTimeline`. Appends immutable events (console + localStorage). All key actions logged. No raw PHI in events.
- **Routes:** All required present (see Route Inventory below). Root `/` redirects to `/provider/dashboard` (intentional for prototype; login still accessible).
- **Shell / Navigation:** `FAHCShell`, `FAHCSideNav` (dark blue, white logo), `FAHCTopNav`, responsive mobile drawer. Provider vs Admin variants.
- **Core Features:** 
  - Referrals list (masked only) + detail (unlock PHI with audit).
  - Revenue form with on-blur autosave + submit.
  - Profile with logo uploader (mock), photos, "Verify — no changes needed".
  - Reports with charts (mock data).
  - Settings with MFA toggle + demo role switcher.
  - Chat stub.
  - Admin surfaces with `AdminScopeNote` clarifying scope.
- **Components:** All listed in Master_Prompt + UAT prompt present and used (FAHCCard, FAHCMetricCard, FAHCStatusBadge, FAHCEmptyState, FAHCReferralTable, FAHCReferralDetailPanel, FAHCProfileForm, FAHCRevenueForm, FAHCConfirmNoChangesButton, FAHCProviderLogoUploader, FAHCUploadCard, FAHCChatThread, FAHCAuditTimeline, FAHCLoginPage, etc.).
- **Branding:** `tailwind.config.ts` + `globals.css` match Master_Prompt tokens (Deep Navy #1B4F72, Gold #FAD06E, Cream, etc.). Lora/Inter fonts.
- **Logos:** Multiple assets in `public/logos/` (webp/png variants). `Logo.tsx` + `BrandMark` with `tone="white"` using CSS `[filter:brightness(0)_invert(1)]`.

## Route Inventory (Verified Present + Built)

**Provider:**
- /provider/login
- /provider/forgot-password
- /provider/dashboard
- /provider/referrals
- /provider/referrals/[id]
- /provider/revenue
- /provider/profile
- /provider/chat
- /provider/reports
- /provider/settings

**Admin:**
- /admin/provider-portal
- /admin/provider-portal/agencies
- /admin/provider-portal/referrals
- /admin/provider-portal/audit
- /admin/provider-portal/support

**Root:**
- / → redirects to /provider/dashboard (client-side)

All routes render without crash in build. Provider surfaces use `(app)` group + `ProviderAppLayout` (requires auth). Auth pages use `(auth)` group (no shell). Admin uses own layout.

## Component Inventory (All Present & Used)

- Layout: FAHCShell, FAHCLoginPage, FAHCTopNav, FAHCSideNav, navConfig
- Primitives: FAHCCard, FAHCMetricCard, FAHCStatusBadge, FAHCEmptyState
- Domain: FAHCReferralTable, FAHCReferralDetailPanel
- Forms: FAHCProfileForm, FAHCRevenueForm, FAHCConfirmNoChangesButton
- Uploads: FAHCProviderLogoUploader, FAHCUploadCard
- Chat: FAHCChatThread
- Audit: FAHCAuditTimeline
- Other: PhiBadge/PhiWarning, AdminScopeNote, Charts, etc.

## Known Findings from Initial Check (Confirmed)

1. **package.json scripts:** dev/build/start/typecheck present. **No lint, no test.** "Skipping linting" during build. Gap documented.
2. **README vs code redirect:**
   - README: "open http://localhost:3000 → redirects to /provider/login"
   - Actual `src/app/page.tsx`: `redirect('/provider/dashboard')` with comment "Login is not required — the portal root opens straight to the dashboard."
   - Auth auto-hydrates demo user → dashboard experience for prototype convenience.
   - Login route remains fully accessible and functional.
3. **Route groups & surfaces:** Correct `(auth)` / `(app)` / admin. Tenant isolation in api but admin surfaces need extra scrutiny (see agents).
4. **Referral list:** Never accesses `fullNameEncrypted` (confirmed in FAHCReferralTable + comment). Detail unlocks only.
5. **Unmask audit:** `phi_unmasked` + `referral_viewed` logged. Metadata non-PHI.
6. **Logo.tsx:** Uses `/logos/FIndaHomeCare-Logo.webp` + invert filter for `tone="white"`. Used on darkBlue sidenav and login left panel. Potential non-compliant recoloring/deformation. Inspected by Logo Agent. Other uses (color) + uploader preview use object-contain.

## Live Vercel vs Local

- Live: https://fahc-provider-portal.vercel.app serves matching UI (login form + brand panel, logos, cream/dark blue palette, surfaces).
- Root fetch surfaces login-like content (consistent with client behavior).
- Local build + live appear to match the same implementation (no obvious divergence in route structure or copy from sampled pages).
- All prototype disclaimers ("Prototype · mock authentication") visible.

## Implementation Gaps / Suspicious Areas (to be UAT'd by agents)

- No lint script / eslint config (document + decide whether to stub or add).
- No role guard on admin layouts/pages (any logged-in user reaches admin; scoped data + scope note mitigate but not ideal per requirements).
- AuditEvent lacks `surface` field (provider vs admin vs public). All logAudit calls omit it.
- Root behavior vs README mismatch (to be aligned).
- Logo white tone via filter (fix or document).
- No real backend; purely mock (per design).
- No tests (none configured).
- Charts and some data are illustrative only.
- Mobile/responsive and a11y to be verified across all screens.
- No AI/LLM anywhere (PHI isolation PASS by absence).

## Commands Available

- npm install (if needed)
- npm run dev
- npm run build (PASS)
- npm run typecheck (PASS)
- No lint/test (gap)

## Conclusion for Baseline

The implementation is a complete, cohesive, mock-only prototype matching the Master_Prompt architecture and UAT requirements. No Salesforce code. Strong tenant/PHI/audit hygiene in the core paths. Several documentation, lint, admin-surface, audit-surface, and logo items to harden.

Ready to deploy 24 agents for detailed UAT, fixes (logo + surgical), and full reporting.

**Next:** Agent execution + fixes + docs.