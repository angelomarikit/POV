const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generatePassCode(prefix = 'POV'): string {
  let body = ''
  for (let i = 0; i < 6; i += 1) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return `${prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'POV'}-${body}`
}

export function formatRegistrantName(familyName: string, firstName: string) {
  return `${familyName.trim().toUpperCase()}, ${firstName.trim().toUpperCase()}`
}

export function formatRoleLabel(role: string) {
  if (role === 'affiliate') return 'Affiliate'
  if (role === 'member') return 'Member'
  return 'Guest'
}

export function normalizePassCode(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, '')
}
