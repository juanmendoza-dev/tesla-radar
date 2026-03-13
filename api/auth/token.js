// POST /api/auth/token
//
// Server-side Tesla OAuth token exchange.
// Keeps TESLA_CLIENT_SECRET safe — never exposed to the browser.
// Supports both initial authorization and refresh token flows.

const TESLA_TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token'
const REDIRECT_URI = 'https://tesla-radar.vercel.app/callback'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const clientId = process.env.VITE_TESLA_CLIENT_ID || ''
  const clientSecret = process.env.TESLA_CLIENT_SECRET || ''

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Server misconfigured — missing TESLA_CLIENT_ID or TESLA_CLIENT_SECRET',
    })
  }

  const { grant_type, code, code_verifier, refresh_token } = req.body || {}

  // Build token request body
  const body = new URLSearchParams({
    grant_type: grant_type || 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
  })

  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return res.status(400).json({ error: 'Missing refresh_token' })
    }
    body.set('refresh_token', refresh_token)
  } else {
    if (!code || !code_verifier) {
      return res.status(400).json({ error: 'Missing code or code_verifier' })
    }
    body.set('code', code)
    body.set('code_verifier', code_verifier)
    body.set('redirect_uri', REDIRECT_URI)
  }

  try {
    const tokenRes = await fetch(TESLA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error('Tesla token error:', data)
      return res.status(tokenRes.status).json({
        error: 'Token exchange failed',
        details: data.error_description || data.error || 'Unknown error',
      })
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error('Token exchange fetch error:', err)
    return res.status(500).json({ error: 'Token exchange request failed' })
  }
}
