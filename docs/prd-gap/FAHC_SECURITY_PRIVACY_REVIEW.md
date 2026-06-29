# FAHC Security & Privacy Review

Scope: `feature/fahc-prd-gap-completion`. Prototype — mock data, mock auth, no live
integrations. This review covers the PHI/compliance posture after the gap-completion work.

## PHI boundary controls

| Control | Where | Notes |
|---|---|---|
| Tenant isolation | `src/lib/api.ts` | Every read filters `agencyId === user.agencyId`; only internal roles cross tenants. |
| Minimum necessary (list) | `FAHCReferralTable.tsx` | Reads masked fields only; never `fullNameEncrypted`; search excludes it. Message snippet truncated to 80 chars. |
| PHI unmask is explicit + audited | `FAHCReferralDetailPanel.tsx` | Reveal logs `phi_unmasked` (`phiFlag: true`) with actor/role/IP/timestamp. |
| No PHI in URLs | all routes | Opaque IDs only (`ref-100`, `case-…`). |
| Audit metadata sanitization | `src/lib/audit.ts` | `sanitizeMetadata()` drops PHI-risk keys + bounds string length, at write **and** render. |
| Free-text PHI risk removed | revenue (structured select), profile (operational warning), chat (PHI detection) | `src/lib/phi.ts` blocks emails/phones/SSN/DOB/clinical terms in chat. |
| Upload filename redaction | `FAHCUploadCard.tsx` | Display labels are generic (Image N); audit stores category/MIME/size only — never raw filename. |
| Immutable audit trail | `src/lib/audit.ts` | Append-only store + `[AUDIT]` JSON to console; `surface` required for context. |

## Access control

- **Login required**; 30-min inactivity timeout (`session_timeout` audited).
- **Admin surfaces gated** to internal roles; provider attempts blocked + `admin_access_denied`.
- **Read-only Auditor** can view admin surfaces but cannot mutate (referrals, support cases,
  activation).
- **Locked referrals** are read-only for providers; internal-admin override is audited
  (`admin_locked_referral_override`).

## Static guardrails (CI-style, local)

`npm run check:phi` fails the build if anyone:
- references `fullNameEncrypted` outside the allow-list,
- adds a raw `console.log` that isn't the `[AUDIT]` channel,
- puts a PHI-risk key in audit metadata,
- makes audit `surface` optional again.

`npm run smoke` fails if a required route/module is missing or the referral table regresses
to reading `fullNameEncrypted`.

## Residual risk / deferred

- **No real auth/encryption** — mock only by design (production: Identity Platform + Shield/KMS).
- **WCAG 2.1 AA** — built toward AA (focus rings, labels, alt text, ARIA), but an automated
  axe/Lighthouse pass + screen-reader test is recommended before UAT sign-off. Some IDE
  a11y-linter hints remain on `<dl>`/label-association patterns (cosmetic, non-blocking).
- **PHI detector is heuristic** — conservative blocker, not de-identification. Acceptable for
  a prototype that should carry no PHI at all.
- **ESLint not installed** — substituted by `typecheck` + `check:phi` + `smoke`. Adding
  `eslint-config-next` + `jsx-a11y` is recommended for production.
