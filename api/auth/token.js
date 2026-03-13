// POST /api/auth/token
//
// Server-side Tesla OAuth token exchange.
// Keeps TESLA_CLIENT_SECRET safe — never exposed to the browser.
// Supports both initial authorization and refresh token flows.

const TESLA_TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token'
const REDIRECT_URI = 'https://tesla-radar.vercel.app/callback'
const AUDIENCE = 'https://fleet-api.prd.na.vn.cloud.tesla.com'

function maskCredential(value) {
  if (!value || value.length < 10) return value ? '***too_short***' : '***empty***'
  return value.slice(0, 6) + '...' + value.slice(-4)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Read credentials — strip hidden \r \n whitespace that Vercel copy-paste can introduce
  const clientId = (process.env.VITE_TESLA_CLIENT_ID || '').replace(/[\r\n\s]+/g, '')
  const clientSecret = (process.env.TESLA_CLIENT_SECRET || '').replace(/[\r\n\s]+/g, '')

  // Log masked credentials for verification (server logs only, never sent to frontend)
  console.log('[Tesla Auth] Credential check:', {
    client_id: maskCredential(clientId),
    client_secret: maskCredential(clientSecret),
    client_id_length: clientId.length,
    client_secret_length: clientSecret.length,
  })

  if (!clientId) {
    console.error('[Tesla Auth] VITE_TESLA_CLIENT_ID is empty')
    return res.status(500).json({ error: 'Server misconfigured — missing client ID' })
  }

  if (!clientSecret) {
    console.error('[Tesla Auth] TESLA_CLIENT_SECRET is empty')
    return res.status(500).json({ error: 'Server misconfigured — missing client secret' })
  }

  const { grant_type, code, code_verifier, refresh_token } = req.body || {}

  // Build token request — must be application/x-www-form-urlencoded
  const body = new URLSearchParams({
    grant_type: grant_type || 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    audience: AUDIENCE,
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

  // Log the request shape (no secrets)
  console.log('[Tesla Auth] Token request:', {
    grant_type: body.get('grant_type'),
    redirect_uri: body.get('redirect_uri'),
    audience: body.get('audience'),
    has_code: !!body.get('code'),
    has_code_verifier: !!body.get('code_verifier'),
    has_client_secret: !!body.get('client_secret'),
    has_refresh_token: !!body.get('refresh_token'),
  })

  try {
    const tokenRes = await fetch(TESLA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    // Read the full response body
    const responseText = await tokenRes.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('[Tesla Auth] Non-JSON response:', responseText.slice(0, 500))
      return res.status(502).json({
        error: 'Tesla returned non-JSON response',
        details: responseText.slice(0, 200),
      })
    }

    if (!tokenRes.ok) {
      // Log FULL error response to server logs
      console.error('[Tesla Auth] Token exchange FAILED:', {
        status: tokenRes.status,
        error: data.error,
        error_description: data.error_description,
        full_response: data,
      })

      return res.status(tokenRes.status).json({
        error: 'Token exchange failed',
        details: data.error_description || data.error || 'Unknown error',
        tesla_error: data.error,
      })
    }

    console.log('[Tesla Auth] Token exchange SUCCESS')
    return res.status(200).json(data)
  } catch (err) {
    console.error('[Tesla Auth] Fetch error:', err.message, err.stack)
    return res.status(500).json({ error: 'Token exchange request failed', details: err.message })
  }
}
