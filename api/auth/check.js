// GET /api/auth/check
//
// Diagnostic endpoint — shows masked credentials and detects
// hidden characters (carriage returns, whitespace, etc.)
// Safe to expose: only shows first 6 + last 4 chars.

function diagnose(name, value) {
  if (!value) return { name, status: 'MISSING', value: '' }

  const hasCarriageReturn = value.includes('\r')
  const hasNewline = value.includes('\n')
  const hasLeadingSpace = value !== value.trimStart()
  const hasTrailingSpace = value !== value.trimEnd()
  const clean = value.replace(/[\r\n\s]+/g, '')

  return {
    name,
    status: hasCarriageReturn || hasNewline || hasLeadingSpace || hasTrailingSpace
      ? 'CORRUPTED'
      : 'OK',
    length: value.length,
    clean_length: clean.length,
    masked: clean.length >= 10
      ? clean.slice(0, 6) + '...' + clean.slice(-4)
      : '***too_short***',
    issues: [
      hasCarriageReturn && 'HAS_CARRIAGE_RETURN (^M / \\r)',
      hasNewline && 'HAS_NEWLINE (\\n)',
      hasLeadingSpace && 'HAS_LEADING_WHITESPACE',
      hasTrailingSpace && 'HAS_TRAILING_WHITESPACE',
    ].filter(Boolean),
  }
}

export default function handler(req, res) {
  const clientId = process.env.VITE_TESLA_CLIENT_ID || ''
  const clientSecret = process.env.TESLA_CLIENT_SECRET || ''

  const result = {
    VITE_TESLA_CLIENT_ID: diagnose('VITE_TESLA_CLIENT_ID', clientId),
    TESLA_CLIENT_SECRET: diagnose('TESLA_CLIENT_SECRET', clientSecret),
    expected_client_id: 'c877cc99-0ae1-473c-96c9-15f010d0eefa',
    client_id_matches: clientId.trim().replace(/[\r\n]/g, '') === 'c877cc99-0ae1-473c-96c9-15f010d0eefa',
  }

  return res.status(200).json(result)
}
