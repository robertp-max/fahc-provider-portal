# FAHC Missing Requirements — Fixed

What this branch (`feature/fahc-prd-gap-completion`) added on top of the baseline.

## Auth, session & access
- **Login is required** again. `/` → `/provider/login`; the demo provider is signed in
  only on explicit login (any non-empty credentials). README reconciled.
- **30-minute inactivity timeout** with a calm pre-logout warning
  (`SessionTimeoutWarning`) and a "Stay signed in" action. Timeout logs `session_timeout`.
- **Auth audit events**: `login`, `logout`, `session_timeout`, `mfa_toggled`, `role_switched`.
- **Real admin role gate**: only internal roles (Internal Admin, Internal Referral
  Coordinator, Internal Compliance/Audit, Read-only Auditor) reach `/admin/*`. Provider
  roles get a calm blocked state; `admin_access_denied` is logged. Internal entry logs
  `admin_surface_accessed`.

## Audit hardening
- `AuditEvent.surface` and `LogAuditInput.surface` are now **required**
  (`provider | admin | auth | system`).
- `sanitizeMetadata()` strips PHI-risk keys (name/email/phone/message/notes/address/
  client/patient/diagnosis/etc.) and bounds value length; applied at write time **and**
  again when the audit timeline renders.
- New human-readable audit labels for every new event.

## Referrals
- Referral list shows the PRD **"Looking for"** column (message snippet, truncated to 80
  chars) with a minimum-necessary note. The list still never reads `fullNameEncrypted`.
- **Admin referral detail route** `/admin/provider-portal/referrals/[id]` — agency context,
  internal-only, Read-only Auditor cannot edit, locked-referral edits by admin log
  `admin_locked_referral_override`.

## Revenue
- Free-text supporting notes replaced with a **structured category select** (no PHI path).
- **Autopay** is now a defensible mocked workflow: shows referral, month/year, amount, a
  calculated mock charge basis, "No upload required" and "prototype calculation only — no
  payment is executed". Logs `autopay_revenue_recorded`.

## Profile
- **Operational details** (intake process, capacity notes, public operational summary)
  with a non-PHI warning.
- **Per-day business hours** (Mon–Sun) with open/close time pickers + closed toggle;
  validation requires close > open unless closed.
- **Rate validation**: blocks negatives, warns above a sensible upper bound.
- **Pay methods** are structured (preset-only, no free text).
- Save **audits changed field names only** — never field values.

## Uploads
- Logo: type + 2 MB size validation, error state, `object-contain` (aspect preserved),
  object-URL cleanup on unmount, audit without raw filename.
- Documents/photos: type + 10 MB validation, redacted display labels (Image N / Document N),
  object-URL cleanup, audit with category/MIME/size only.

## Chat & support
- PHI warning above the composer + **PHI input detection** that blocks sending.
- **Attachment stub** (mock, validated) → `chat_attachment_added`.
- **Support case creation** from a thread → `support_case_created` (shared `cases` store).
- Assistant **availability** state (online/away/offline).
- **Admin support detail** `/admin/provider-portal/support/[id]` — transcript, linked case,
  mark-resolved (`support_case_resolved`), Read-only Auditor cannot mutate; logs
  `admin_support_viewed`.

## Admin agency activation
- **Admin agency detail** `/admin/provider-portal/agencies/[id]` — overview, completeness,
  activation status (Subscribed/Unverified · Pending · Active · Suspended/Deactivated),
  required-agreements checklist (Business license / Referral Agreement / BAA). Changes are
  internal-only and log `agency_activation_changed`. No documents are stored.

## Reports
- KPI panel now covers all PRD success metrics (adoption, response time, completion rate,
  revenue compliance, chat first response, profile completeness, uptime, audit coverage),
  clearly labeled prototype/mock.

## Tooling
- `scripts/check-no-phi.mjs` (`npm run check:phi`) and `scripts/smoke.mjs`
  (`npm run smoke`), aggregated as `npm run verify`.
