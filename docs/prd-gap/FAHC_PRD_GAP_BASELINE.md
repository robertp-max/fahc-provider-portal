# FAHC Provider Portal — PRD Gap Baseline

Snapshot of the implementation **before** the gap-completion work on this branch.

| | |
| --- | --- |
| Branch | `feature/fahc-prd-gap-completion` |
| Base commit (main) | `87cdce4` |
| Framework | Next.js 14 (App Router) · TypeScript (strict) · Tailwind 3 |
| Mode | Local prototype — mock data + mock auth, **no Salesforce / no cloud** |

> Note: the working tree at branch creation already contained an in-progress
> groundwork pass (an optional `surface` field threaded through `logAudit`
> calls, an admin attempted-access banner, Logo hardening, a `lint` script
> stub, README note). This baseline documents `main` and folds that groundwork
> into the gap work.

## Package scripts (baseline)

- `dev`, `build`, `start`, `typecheck`
- `lint` → stub echo (no ESLint installed)
- No `test`, no static PHI checks

## Route map (baseline)

Provider (auth, full-screen): `/provider/login`, `/provider/forgot-password`
Provider (app shell): `/provider/dashboard`, `/referrals`, `/referrals/[id]`, `/revenue`, `/profile`, `/chat`, `/reports`, `/settings`
Admin: `/admin/provider-portal`, `/agencies`, `/referrals`, `/audit`, `/support`
Root `/` → redirected to `/provider/dashboard` (inconsistent with README).

## Component map (baseline)

`FAHCShell`, `FAHCTopNav`, `FAHCSideNav`, `FAHCLoginPage`, `FAHCCard`, `FAHCMetricCard`,
`FAHCStatusBadge`, `FAHCEmptyState`, `PhiBadge/PhiWarning`, `Logo/BrandMark`,
`FAHCReferralTable`, `FAHCReferralDetailPanel`, `FAHCProfileForm`, `FAHCRevenueForm`,
`FAHCConfirmNoChangesButton`, `TagField`, `FAHCProviderLogoUploader`, `FAHCUploadCard`,
`FAHCChatThread`, `FAHCAuditTimeline`, `AdminScopeNote`, charts.

## Auth / access behaviour (baseline)

- `AuthProvider` **auto-signs in** the demo user when no session exists (login not required).
- Admin layout checked only `currentUser` (logged in), **not** internal role.
- `AdminScopeNote` allowed provider roles to view admin screens in "scoped" mode.

## Audit event shape (baseline)

`id, actorId, actorRole, agencyId, action, objectType, objectId, beforeHash?, afterHash?, timestamp, ip?, userAgent?, phiFlag, surface?('provider'|'admin'|'public'), metadata?`
Metadata was rendered directly in `FAHCAuditTimeline` (no sanitization layer).

## Mock data model (baseline)

`Agency, ProviderUser, Referral, ReferralOutcomeUpdate, RevenueSubmission, SupportThread, ChatMessage, AuditEvent, DocumentFile`. Tenant isolation enforced in `src/lib/api.ts` (`record.agencyId === user.agencyId`; internal roles cross-tenant).

## Requirements already satisfied (baseline)

- Secure-styled login, Remember Username, Forgot Password flow.
- Dashboard summary, quick links, alerts, trend.
- Referral list with masked PHI; detail unmask + audit; locked read-only.
- Revenue autosave-on-blur + submit; Autopay "no upload" copy.
- Profile edit (rates, services, languages, certs), logo/photo upload preview, Verify-no-changes.
- Chat thread history + typing indicator.
- Reports with partial KPI list.
- Admin console screens (overview, agencies, referrals, audit, support).
- Tenant isolation; minimum-necessary list view; no PHI in URLs; immutable audit (`[AUDIT]` console + localStorage).

## Missing / partial requirements (baseline) — addressed on this branch

1. Root/login behaviour inconsistent with README; auto-login bypasses login.
2. No real admin role gate; provider roles could view scoped admin screens.
3. Audit `surface` optional/partial; metadata not sanitized; rendered raw.
4. Referral list missing PRD "Message / What Are You Looking For?" column.
5. Admin referral rows pointed at the provider detail route (no admin detail route).
6. Revenue Supporting Notes was free text (PHI risk).
7. Autopay was copy-only, not a defensible mocked workflow.
8. Profile missing Operational Details + per-day business-hours pickers; weak rate validation; free-text pay methods.
9. Uploads didn't enforce type/size; filename (possible PHI) logged; no unmount cleanup.
10. Chat missing attachment stub, case-creation stub, availability state, PHI warning/detection.
11. Reports missing several PRD success-metric KPIs.
12. Admin support queue linked back to provider chat; no admin handling.
13. No admin agency detail / activation gate.
14. Session timeout claimed but not enforced; MFA toggle / login / logout not audited.
15. No lint/test/PHI static checks; performance/WCAG criteria not documented.
