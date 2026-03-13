// Tesla Fleet API integration
// OAuth PKCE flow + vehicle commands
//
// Token exchange happens server-side via /api/auth/token
// to keep TESLA_CLIENT_SECRET safe.

const TESLA_AUTH_URL = 'https://auth.tesla.com/oauth2/v3/authorize'
const TESLA_API_URL = 'https://fleet-api.prd.na.vn.cloud.tesla.com'

const CLIENT_ID = import.meta.env.VITE_TESLA_CLIENT_ID || ''
const REDIRECT_URI = 'https://tesla-radar.vercel.app/callback'
const SCOPES = 'openid offline_access vehicle_device_data vehicle_location vehicle_cmds'
const AUDIENCE = 'https://fleet-api.prd.na.vn.cloud.tesla.com'

const TOKEN_KEY = 'tesla_tokens'

// ── PKCE helpers ────────────────────────────────────────────────────

function generateCodeVerifier() {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

function base64UrlEncode(buffer) {
  let str = ''
  for (const byte of buffer) {
    str += String.fromCharCode(byte)
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ── OAuth flow ──────────────────────────────────────────────────────

export async function startOAuthFlow() {
  const state = crypto.randomUUID()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Store PKCE verifier + state — use localStorage because sessionStorage
  // gets cleared when Tesla's auth page redirects back in some browsers
  localStorage.setItem('oauth_state', state)
  localStorage.setItem('oauth_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${TESLA_AUTH_URL}?${params}`
}

export async function handleCallback(code, state) {
  // Verify state
  const savedState = localStorage.getItem('oauth_state')
  if (state !== savedState) throw new Error('State mismatch — possible CSRF attack')

  // Retrieve PKCE verifier
  const codeVerifier = localStorage.getItem('oauth_code_verifier')
  if (!codeVerifier) throw new Error('Missing code_verifier — restart OAuth flow')

  // Exchange code for tokens via server-side route (keeps client_secret safe)
  const res = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.details || data.error || 'Token exchange failed')
  }

  // Store tokens
  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }))

  // Clean up PKCE state
  localStorage.removeItem('oauth_state')
  localStorage.removeItem('oauth_code_verifier')

  return data
}

// ── Token management ────────────────────────────────────────────────

export function getTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY))
  } catch {
    return null
  }
}

export function isAuthenticated() {
  const tokens = getTokens()
  return tokens && tokens.expires_at > Date.now()
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
}

async function refreshAccessToken() {
  const tokens = getTokens()
  if (!tokens?.refresh_token) throw new Error('No refresh token')

  const res = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.details || 'Token refresh failed')

  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }))

  return data
}

// ── Fleet API calls ─────────────────────────────────────────────────

export async function teslaAPI(path, options = {}) {
  let tokens = getTokens()
  if (!tokens) throw new Error('Not authenticated')

  // Auto-refresh if token expired
  if (tokens.expires_at < Date.now()) {
    await refreshAccessToken()
    tokens = getTokens()
  }

  const res = await fetch(`${TESLA_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) throw new Error(`Tesla API error: ${res.status}`)
  return res.json()
}

export async function getVehicles() {
  const data = await teslaAPI('/api/1/vehicles')
  return data.response || []
}

export async function sendNavigation(vehicleId, lat, lng) {
  return teslaAPI(`/api/1/vehicles/${vehicleId}/command/navigation_gps_request`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'share_ext_content_raw',
      value: { 'android.intent.extra.TEXT': `${lat},${lng}` },
      locale: 'en-US',
      timestamp_ms: Date.now().toString(),
    }),
  })
}
