# FAHC Route Coverage

**Date:** 2026-06-28

## Required Routes — Status

Provider:
- /provider/login — exists, renders FAHCLoginPage, mock auth, bounces if authed. Live match.
- /provider/forgot-password — exists, mock reset flow.
- /provider/dashboard — exists, metrics + alerts + links.
- /provider/referrals — exists, masked table.
- /provider/referrals/[id] — dynamic, tenant guard + detail panel + unlock.
- /provider/revenue — exists, autosave form + history.
- /provider/profile — exists, form + logo + uploads + verify.
- /provider/chat — exists, stub threads.
- /provider/reports — exists, charts + KPIs.
- /provider/settings — exists, MFA + demo role switcher.

Admin:
- /admin/provider-portal — exists, overview + scope note + audit summary.
- /admin/provider-portal/agencies — exists, agency cards (scoped).
- /admin/provider-portal/referrals — exists, cross-tenant masked table.
- /admin/provider-portal/audit — exists, global timeline + PHI counts.
- /admin/provider-portal/support — exists, thread queues (scoped).

Root:
- / — redirects to /provider/dashboard (intentional prototype; documented).

## Verification
- Build output lists every route.
- typecheck PASS.
- Live Vercel serves matching UI for sampled paths (login + branding).
- No 404s for listed routes in source.
- All use correct shells (auth vs app vs admin).

## Notes
- Root behavior differs from original README — fixed in docs.
- Admin surfaces now have explicit limited state for non-internals.

**Result:** FULL COVERAGE — all required routes present and functional in prototype.
