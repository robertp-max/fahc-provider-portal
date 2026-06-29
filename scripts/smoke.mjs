// Route / structure smoke test for the FAHC provider portal.
// Run with: node scripts/smoke.mjs   (also wired as `npm run smoke`)
// Verifies that every required route and key module exists on disk.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const REQUIRED = [
  // root + provider auth
  'src/app/page.tsx',
  'src/app/provider/(auth)/login/page.tsx',
  'src/app/provider/(auth)/forgot-password/page.tsx',
  // provider app
  'src/app/provider/(app)/layout.tsx',
  'src/app/provider/(app)/dashboard/page.tsx',
  'src/app/provider/(app)/referrals/page.tsx',
  'src/app/provider/(app)/referrals/[id]/page.tsx',
  'src/app/provider/(app)/revenue/page.tsx',
  'src/app/provider/(app)/profile/page.tsx',
  'src/app/provider/(app)/chat/page.tsx',
  'src/app/provider/(app)/reports/page.tsx',
  'src/app/provider/(app)/settings/page.tsx',
  // admin
  'src/app/admin/provider-portal/layout.tsx',
  'src/app/admin/provider-portal/page.tsx',
  'src/app/admin/provider-portal/agencies/page.tsx',
  'src/app/admin/provider-portal/agencies/[id]/page.tsx',
  'src/app/admin/provider-portal/referrals/page.tsx',
  'src/app/admin/provider-portal/referrals/[id]/page.tsx',
  'src/app/admin/provider-portal/audit/page.tsx',
  'src/app/admin/provider-portal/support/page.tsx',
  'src/app/admin/provider-portal/support/[id]/page.tsx',
  // core libs
  'src/lib/types.ts',
  'src/lib/auth.tsx',
  'src/lib/audit.ts',
  'src/lib/api.ts',
  'src/lib/phi.ts',
  'src/lib/cases.ts',
  // docs
  'docs/prd-gap/FAHC_PRD_GAP_BASELINE.md',
  'docs/prd-gap/FAHC_REQUIREMENTS_TRACEABILITY.md',
]

const missing = REQUIRED.filter((p) => !fs.existsSync(path.join(root, p)))

// Spot assertion: the referral TABLE must not reference fullNameEncrypted.
const tablePath = path.join(root, 'src/components/referrals/FAHCReferralTable.tsx')
const tableBad =
  fs.existsSync(tablePath) &&
  fs.readFileSync(tablePath, 'utf8').split('\n').some((l) => l.includes('fullNameEncrypted') && !l.trim().startsWith('//'))

if (missing.length || tableBad) {
  console.error('Smoke test FAILED:\n')
  missing.forEach((p) => console.error('  ✗ missing: ' + p))
  if (tableBad) console.error('  ✗ FAHCReferralTable references fullNameEncrypted in code')
  process.exit(1)
}
console.log(`Smoke test passed — ${REQUIRED.length} required paths present.`)
