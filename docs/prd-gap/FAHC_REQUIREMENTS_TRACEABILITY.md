# FAHC PRD Requirements Traceability

Branch: `feature/fahc-prd-gap-completion`. Source PRD: *Salesforce Experience Cloud
Portal* (re-platformed as a Next.js mock prototype) + Master Prompt.

Status legend: **PASS** = implemented & verified · **PARTIAL** = implemented with
noted limits · **DEFERRED** = intentionally not done (reason given).

| # | Requirement | PRD source | Status before | Implementation files | Verification | Result |
|---|-------------|-----------|---------------|----------------------|--------------|--------|
| 1 | Root → `/provider/login`; login required (no silent auto-login); README matches | §1 Auth | Auto-login; root → dashboard | `src/app/page.tsx`, `src/lib/auth.tsx`, `README.md` | Manual nav + build | PASS |
| 2 | 30-min inactivity session timeout + warning | NFR Security | Claimed, not enforced | `src/lib/auth.tsx`, `src/components/layout/SessionTimeoutWarning.tsx` | Code review (timers); manual | PASS |
| 3 | Audit auth events (login/logout/session_timeout/mfa_toggled/role_switched) | §6 Audit | Only `login` partial | `src/lib/auth.tsx` | Console `[AUDIT]`; audit log UI | PASS |
| 4 | Real admin role gate; providers blocked; `admin_access_denied` logged | §User Roles | Logged-in only | `src/app/admin/provider-portal/layout.tsx` | Role switch in Settings → blocked state | PASS |
| 5 | `surface` required on every audit event | §6 Audit | Optional | `src/lib/types.ts`, `src/lib/audit.ts` | `tsc` (required field) + `check:phi` | PASS |
| 6 | Audit metadata sanitization (strip PHI-risk keys) | NFR Security | None | `src/lib/audit.ts` (`sanitizeMetadata`) | `check:phi`; timeline render | PASS |
| 7 | Audit timeline renders sanitized metadata only | §6 Audit | Raw render | `src/components/audit/FAHCAuditTimeline.tsx` | Code review | PASS |
| 8 | Referral list "Message / What are you looking for?" column, truncated | §3 Referrals | Missing | `src/components/referrals/FAHCReferralTable.tsx` | Manual; 80-char slice | PASS |
| 9 | List never reads/searches `fullNameEncrypted` | §7 Security | Held | `FAHCReferralTable.tsx` | `check:phi` + `smoke` | PASS |
| 10 | Admin referral detail route, agency-aware, auditor read-only, locked override audited | §3 + Roles | Pointed at provider route | `src/app/admin/provider-portal/referrals/[id]/page.tsx`, `FAHCReferralDetailPanel.tsx` | Manual; `admin_locked_referral_override` | PASS |
| 11 | Revenue supporting notes cannot accept PHI (structured) | §3 Revenue | Free text | `src/components/forms/FAHCRevenueForm.tsx` | Code review; structured select | PASS |
| 12 | Autopay mocked, no-charge workflow; `autopay_revenue_recorded` | §3 Revenue / Decision Log | Copy only | `FAHCRevenueForm.tsx` | Manual; audit | PASS |
| 13 | Profile: operational details + per-day business hours + rate validation + structured pay methods | §4 Profile | Missing/partial | `src/components/forms/FAHCProfileForm.tsx`, `TagField.tsx`, `src/lib/types.ts` | Manual; validation | PASS |
| 14 | Profile save audits field **names** only (no values) | §6 Audit | Logged displayName value | `FAHCProfileForm.tsx` | `check:phi` | PASS |
| 15 | Upload type/size validation, object-URL cleanup, aspect-ratio, redacted filenames | §4 Media | None | `FAHCProviderLogoUploader.tsx`, `FAHCUploadCard.tsx` | Manual; code review | PASS |
| 16 | Chat PHI warning + PHI input detection (block) | §5 Chat | Missing | `FAHCChatThread.tsx`, `src/lib/phi.ts` | Manual; `checkForPhi` | PASS |
| 17 | Chat attachment stub + `chat_attachment_added` | §5 Chat | Missing | `FAHCChatThread.tsx` | Manual; audit | PASS |
| 18 | Support case creation stub + `support_case_created` | §5 Chat | Missing | `src/lib/cases.ts`, `chat/page.tsx` | Manual; audit | PASS |
| 19 | Assistant availability state | §5 Chat | Static only | `FAHCChatThread.tsx` | Code review | PASS |
| 20 | Admin support detail route; mark resolved; auditor read-only | §5 + Roles | Linked to provider chat | `src/app/admin/provider-portal/support/[id]/page.tsx` | Manual; `support_case_resolved` | PASS |
| 21 | Admin agency detail + activation gate + agreements checklist; audited | §Data / Risks | Missing | `src/app/admin/provider-portal/agencies/[id]/page.tsx`, `src/lib/types.ts` | Manual; `agency_activation_changed` | PASS |
| 22 | Reports show all PRD success-metric KPIs (mock-labeled) | Success Metrics | Partial (4) | `src/app/provider/(app)/reports/page.tsx` | Manual | PASS |
| 23 | Static no-PHI / audit-safety checks + route smoke | Testing Plan | None | `scripts/check-no-phi.mjs`, `scripts/smoke.mjs`, `package.json` | `npm run verify` | PASS |
| 24 | Typecheck + build green | Testing Plan | Green | — | `npm run typecheck`, `npm run build` | PASS |
| 25 | WCAG 2.1 AA | Compliance | Targeted | global focus rings, labels, alt text, `aria-*` | Automated a11y audit recommended | PARTIAL |
| 26 | ESLint | Testing Plan | Stub | `package.json` lint stub | n/a | DEFERRED — no ESLint installed; `check:phi`/`smoke`/`typecheck` substitute (see security review) |
| 27 | `input[type=month]` cross-browser | §3 Revenue | n/a | `FAHCRevenueForm.tsx` | n/a | PARTIAL — degrades to text in Firefox/Safari; acceptable for prototype |

## PRD items intentionally out of scope (prototype)

- Live Salesforce / Apex / Lightning, Service Cloud, real payments/Autopay charge,
  Google Cloud / Firebase / Drive, real email for password reset. All mocked per the
  no-runtime-integration rule.
