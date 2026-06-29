# Find A Home Care — Provider Portal (Prototype)

A local **Next.js (App Router) + TypeScript + Tailwind** prototype of the secure
external **provider portal** for Find A Home Care partner agencies.

> **Prototype scope:** mock data + mocked authentication only. **No Salesforce,
> no Apex, no Lightning, no cloud services.** Nothing is deployed and no real PHI
> is used. This is the front-end blueprint of the experience described in the
> Salesforce Experience Cloud PRD, intentionally re-platformed onto the GCP
> target architecture (built locally first, pending a signed GCP BAA).

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000  → redirects to /provider/login
```

Sign in with **any** username and password (auth is mocked). The seeded session
is *Sarah Intake* at *Compassionate Bay Care* (`agency-101`).

```bash
npm run typecheck   # strict TypeScript, no `any` in app logic
npm run build       # production build
```

## What to try

- **Login** — Remember Username + Forgot Password flow (`/provider/forgot-password`).
- **Dashboard** — referral summary, alerts, quick links, revenue trend.
- **Referrals** — masked list; open a referral, click **Unlock PHI** (writes a
  PHI audit event), update an outcome, and notice **locked** referrals are
  read-only.
- **Revenue** — type a figure and click out of the field → **autosaves** with a
  timestamp; Autopay needs no upload.
- **Profile** — edit rates/services, upload a logo & photos, or click
  **Verify — no changes needed** (logs a `verified_with_no_changes` event).
- **Chat / Reports / Settings** — support threads, performance charts, MFA toggle.
- **Settings → Demo controls** — switch to **Internal Admin** to unlock the
  **Admin Console** (`/admin/provider-portal`), edit locked referrals, and view
  cross-tenant data + the global immutable **Audit Log**.

> Open your browser dev-tools console to watch `[AUDIT]` JSON payloads emitted on
> every governed action.

## Architecture

| Concern | Prototype | Production target |
| --- | --- | --- |
| Hosting | `next dev` on `:3000` | Google Cloud Run |
| Auth | `src/lib/auth.tsx` (mock) | Google Identity Platform / Firebase (JWT claims) |
| Data | `src/lib/mockData.ts` + `src/lib/api.ts` | Cloud SQL (Postgres) / Firestore |
| Storage | object URLs | Cloud Storage + Workspace Drive (post-BAA) |
| Audit | `src/lib/audit.ts` (console + localStorage) | Cloud Logging / immutable tables |

### Project structure

```
src/
  app/
    provider/(auth)/{login,forgot-password}      # full-screen, no shell
    provider/(app)/{dashboard,referrals,revenue, # authenticated shell
                    profile,chat,reports,settings}
    admin/provider-portal/{,agencies,referrals,  # internal console (stubbed)
                           audit,support}
  components/{ui,layout,referrals,forms,uploads,chat,audit,charts,admin}
  lib/{types,mockData,auth,audit,api,utils}.ts
```

## Security & PHI boundaries (enforced in the prototype)

- **Tenant isolation** — every read in `src/lib/api.ts` filters
  `record.agencyId === user.agencyId`. Only internal/auditor roles see across
  tenants. A referral outside your agency 404s on the detail route.
- **Minimum necessary** — the referral **list never reads `fullNameEncrypted`**;
  only masked fields. The detail page un-masks for authorized users and **logs an
  audit event** each time.
- **No PHI in URLs** — routes use opaque IDs (`/provider/referrals/ref-100`).
- **Immutable audit** — viewing detail, unmasking PHI, updating outcomes,
  autosaving/submitting revenue, and "verify no changes" all append to an
  append-only trail and `console.log` an `AuditEvent` JSON payload.
- **Accessibility** — semantic landmarks, labelled controls, visible focus rings,
  and brand tokens chosen for WCAG-friendly contrast.

## Deliverables checklist

- [x] **Mock vs Real** — purely mock data, routes, and Tailwind styling.
- [x] **No-Deploy** — runs locally on `:3000`.
- [x] **Security** — masked names on the list view; tenant isolation enforced.
- [x] **Typecheck** — strict interfaces, no `any` in app logic (`npm run typecheck`).
- [x] **WCAG** — brand tokens, focus states, keyboard-navigable tables.
