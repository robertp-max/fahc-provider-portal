# FAHC Fix Log

**Date:** 2026-06-28

## Applied Fixes (Surgical, Low Risk, Tied to UAT Requirements)

| ID | Area | Severity | Fix | Files | Evidence |
|----|------|----------|-----|-------|----------|
| F1 | Scripts | P3 | Added `lint` script that documents gap (no eslint) | package.json | Build now acknowledges lint absence cleanly |
| F2 | Docs/Redirect | P2 | Updated README to match actual root → /provider/dashboard behavior + noted login accessibility | README.md | Matches code comment and auth auto-hydrate |
| F3 | Audit / Compliance | P1 | Added `surface?: 'provider'\|'admin'\|'public'` to AuditEvent + LogAuditInput. Updated logAudit. Populated on all call sites | src/lib/types.ts, src/lib/audit.ts, 6 component files (detail, revenue x2, profile, confirm, logo, upload) | All governed actions now carry surface. Timeline data enriched |
| F4 | Admin Surface Restriction | P1 | Added role check + prominent limited-access banner + audit log for non-internal attempts in admin layout. Still allows demo via role switcher | src/app/admin/provider-portal/layout.tsx | Non-provider roles see clear guidance + link to Settings demo controls |
| F5 | Logo Integrity | P2 | Hardened Logo + BrandMark: object-contain, max-h-9, better filter application + style, explicit height hint, title, alt improvements, JSDoc warning for white asset. No aspect distortion | src/components/ui/Logo.tsx | See FAHC_LOGO_FIXES.md. All dark/light usages protected |
| F6 | Admin UX | P2 | Added explicit admin access attempt logging | layout.tsx (above) | Audit now records attempts |

All fixes are small, cohesive, no architecture change, no real integrations, no PHI exposure.

## Deferred (Documented in 24-agent report)
- Full eslint setup
- E2E tests
- Official white logo asset
- Various polish (charts a11y, drag drop, etc.)

## Verification Post-Fix
- typecheck: PASS
- build: PASS (all routes)
- No new console errors introduced
- Tenant isolation and audit invariants preserved
