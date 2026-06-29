// Static PHI / audit-safety checks for the FAHC provider portal.
// Run with: node scripts/check-no-phi.mjs   (also wired as `npm run check:phi`)
//
// Fails (exit 1) if any of these regress:
//   1. `fullNameEncrypted` referenced outside an allow-list of files
//   2. raw console.log that is not the audit channel ([AUDIT])
//   3. logAudit metadata literals containing PHI-risk keys
//   4. AuditEvent / LogAuditInput `surface` made optional again

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src')

const FULLNAME_ALLOWED = [
  'src/lib/types.ts',
  'src/lib/mockData.ts',
  'src/lib/referralFields.ts', // classification map (marks the field as PHI)
  'src/components/referrals/FAHCReferralDetailPanel.tsx',
].map((p) => p.replace(/\\/g, '/'))

const UNSAFE_METADATA_TOKENS = [
  'fullname',
  'email',
  'phone',
  'message',
  'notes',
  'note',
  'body',
  'address',
  'contact',
  'client',
  'patient',
  'diagnos',
  'condition',
  'ssn',
  'dob',
  'birth',
]

const violations = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(ts|tsx)$/.test(entry.name)) checkFile(full)
  }
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/')
}

function checkFile(file) {
  const r = rel(file)
  const text = fs.readFileSync(file, 'utf8')

  // 1. fullNameEncrypted outside allow-list
  if (text.includes('fullNameEncrypted') && !FULLNAME_ALLOWED.includes(r)) {
    violations.push(`${r}: references fullNameEncrypted outside the allow-list`)
  }

  // 2. raw console.log that isn't the audit channel
  text.split('\n').forEach((line, i) => {
    if (/console\.log\s*\(/.test(line) && !line.includes('[AUDIT]')) {
      violations.push(`${r}:${i + 1}: raw console.log (only [AUDIT] is allowed)`)
    }
  })

  // 3. logAudit metadata literals with PHI-risk keys
  const metaRe = /metadata:\s*\{([^}]*)\}/g
  let m
  while ((m = metaRe.exec(text)) !== null) {
    const block = m[1]
    const keyRe = /(\w+)\s*:/g
    let k
    while ((k = keyRe.exec(block)) !== null) {
      const key = k[1].toLowerCase()
      if (UNSAFE_METADATA_TOKENS.some((t) => key.includes(t))) {
        violations.push(`${r}: audit metadata key "${k[1]}" looks PHI-bearing`)
      }
    }
  }
}

// 4. surface must remain required
const typesText = fs.readFileSync(path.join(srcDir, 'lib', 'types.ts'), 'utf8')
if (/surface\?:/.test(typesText)) {
  violations.push('src/lib/types.ts: AuditEvent.surface must be required (found optional `surface?:`)')
}
const auditText = fs.readFileSync(path.join(srcDir, 'lib', 'audit.ts'), 'utf8')
if (/surface\?:/.test(auditText)) {
  violations.push('src/lib/audit.ts: LogAuditInput.surface must be required (found optional `surface?:`)')
}

walk(srcDir)

if (violations.length) {
  console.error('PHI / audit-safety check FAILED:\n')
  violations.forEach((v) => console.error('  ✗ ' + v))
  console.error(`\n${violations.length} violation(s).`)
  process.exit(1)
}
console.log('PHI / audit-safety check passed — no violations.')
