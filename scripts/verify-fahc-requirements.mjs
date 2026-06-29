// Comprehensive FAHC requirements verification.
// Run with: node scripts/verify-fahc-requirements.mjs  (npm run verify:fahc)
//
// Checks structure + safety invariants and prints a pass/fail checklist.
// Exits 1 if any check fails.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const exists = (p) => fs.existsSync(path.join(root, p))

const checks = []
const check = (name, fn) => {
  try {
    const res = fn()
    checks.push({ name, ok: res === true, detail: res === true ? '' : String(res) })
  } catch (e) {
    checks.push({ name, ok: false, detail: e.message })
  }
}

const REQUIRED_ROUTES = [
  'src/app/page.tsx',
  'src/app/provider/(auth)/login/page.tsx',
  'src/app/provider/(auth)/forgot-password/page.tsx',
  'src/app/provider/(app)/dashboard/page.tsx',
  'src/app/provider/(app)/referrals/page.tsx',
  'src/app/provider/(app)/referrals/[id]/page.tsx',
  'src/app/provider/(app)/revenue/page.tsx',
  'src/app/provider/(app)/profile/page.tsx',
  'src/app/provider/(app)/chat/page.tsx',
  'src/app/provider/(app)/reports/page.tsx',
  'src/app/provider/(app)/settings/page.tsx',
  'src/app/admin/provider-portal/page.tsx',
  'src/app/admin/provider-portal/agencies/page.tsx',
  'src/app/admin/provider-portal/agencies/[id]/page.tsx',
  'src/app/admin/provider-portal/referrals/page.tsx',
  'src/app/admin/provider-portal/referrals/[id]/page.tsx',
  'src/app/admin/provider-portal/revenue/page.tsx',
  'src/app/admin/provider-portal/audit/page.tsx',
  'src/app/admin/provider-portal/support/page.tsx',
  'src/app/admin/provider-portal/support/[id]/page.tsx',
]

const REQUIRED_DOCS = [
  'docs/prd-gap/FAHC_PRD_GAP_BASELINE.md',
  'docs/prd-gap/FAHC_REQUIREMENTS_TRACEABILITY.md',
  'docs/prd-gap/FAHC_MISSING_REQUIREMENTS_FIXED.md',
  'docs/prd-gap/FAHC_SECURITY_PRIVACY_REVIEW.md',
  'docs/prd-gap/FAHC_VERIFICATION_RESULTS.md',
]

const UNSAFE = ['fullname', 'email', 'phone', 'message', 'notes', 'note', 'body', 'address', 'contact', 'client', 'patient', 'diagnos', 'condition', 'ssn', 'dob', 'birth']

check('All required routes exist', () => {
  const missing = REQUIRED_ROUTES.filter((p) => !exists(p))
  return missing.length ? `missing: ${missing.join(', ')}` : true
})

check('Root redirects to /provider/login', () =>
  read('src/app/page.tsx').includes("/provider/login") || 'page.tsx does not redirect to login',
)

check('Referral table never references fullNameEncrypted (code)', () => {
  const bad = read('src/components/referrals/FAHCReferralTable.tsx')
    .split('\n')
    .some((l) => l.includes('fullNameEncrypted') && !l.trim().startsWith('//'))
  return bad ? 'found fullNameEncrypted in table code' : true
})

check('Audit surface is required (types + audit input)', () => {
  const t = read('src/lib/types.ts')
  const a = read('src/lib/audit.ts')
  if (/surface\?:/.test(t)) return 'AuditEvent.surface is optional'
  if (/surface\?:/.test(a)) return 'LogAuditInput.surface is optional'
  return true
})

check('Metadata sanitizer present', () =>
  read('src/lib/audit.ts').includes('sanitizeMetadata') || 'sanitizeMetadata missing',
)

check('No unsafe audit metadata keys in source', () => {
  const offenders = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(ts|tsx)$/.test(e.name)) {
        const text = fs.readFileSync(full, 'utf8')
        const re = /metadata:\s*\{([^}]*)\}/g
        let m
        while ((m = re.exec(text)) !== null) {
          const keyRe = /(\w+)\s*:/g
          let k
          while ((k = keyRe.exec(m[1])) !== null) {
            if (UNSAFE.some((u) => k[1].toLowerCase().includes(u)))
              offenders.push(`${path.relative(root, full)}: ${k[1]}`)
          }
        }
      }
    }
  }
  walk(path.join(root, 'src'))
  return offenders.length ? offenders.join('; ') : true
})

check('No raw console.log (only [AUDIT])', () => {
  const offenders = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(ts|tsx)$/.test(e.name)) {
        fs.readFileSync(full, 'utf8')
          .split('\n')
          .forEach((l, i) => {
            if (/console\.log\s*\(/.test(l) && !l.includes('[AUDIT]'))
              offenders.push(`${path.relative(root, full)}:${i + 1}`)
          })
      }
    }
  }
  walk(path.join(root, 'src'))
  return offenders.length ? offenders.join(', ') : true
})

check('Upload components validate size + type', () => {
  for (const f of [
    'src/components/uploads/FAHCProviderLogoUploader.tsx',
    'src/components/uploads/FAHCUploadCard.tsx',
  ]) {
    const text = read(f)
    if (!/MAX_\w*BYTES/.test(text) || !text.includes('ALLOWED'))
      return `${f} missing size/type validation`
  }
  return true
})

check('PHI detector present (lib/phi.ts) + used in chat', () => {
  if (!exists('src/lib/phi.ts')) return 'lib/phi.ts missing'
  return read('src/components/chat/FAHCChatThread.tsx').includes('checkForPhi') || 'chat does not use checkForPhi'
})

check('Listing state engine present', () =>
  exists('src/lib/listings.ts') ? true : 'lib/listings.ts missing',
)

check('Provider lifecycle gate present + used', () => {
  if (!exists('src/components/provider/ProviderActiveGate.tsx')) return 'ProviderActiveGate missing'
  const ref = read('src/app/provider/(app)/referrals/page.tsx')
  const rev = read('src/app/provider/(app)/revenue/page.tsx')
  return ref.includes('ProviderActiveGate') && rev.includes('ProviderActiveGate')
    ? true
    : 'gate not applied to referrals/revenue'
})

check('All PRD-gap docs exist', () => {
  const missing = REQUIRED_DOCS.filter((p) => !exists(p))
  return missing.length ? `missing: ${missing.join(', ')}` : true
})

// ---- report ----
let failed = 0
console.log('FAHC requirements verification\n')
for (const c of checks) {
  console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}${c.ok ? '' : ` — ${c.detail}`}`)
  if (!c.ok) failed++
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed.`)
if (failed) process.exit(1)
