// Tesla Fleet API integration
// OAuth flow + vehicle commands

const TESLA_AUTH_URL = 'https://auth.tesla.com/oauth2/v3/authorize'
const TESLA_TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token'
const TESLA_API_URL = 'https://fleet-api.prd.na.vn.cloud.tesla.com'

const CLIENT_ID = import.meta.env.VITE_TESLA_CLIENT_ID || ''
const REDIRECT_URI = 'https://tesla-radar.vercel.app/callback'
const SCOPES = 'openid vehicle_device_data vehicle_location vehicle_cmds'

const TOKEN_KEY = 'tesla_tokens'

export function startOAuthFlow() {
  const state = crypto.randomUUID()
  sessionStorage.setItem('oauth_state', state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
  })

  window.location.href = `${TESLA_AUTH_URL}?${params}`
}

export async function handleCallback(code, state) {
  const savedState = sessionStorage.getItem('oauth_state')
  if (state !== savedState) throw new Error('State mismatch')

  const res = await fetch(TESLA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!res.ok) throw new Error('Token exchange failed')
  const tokens = await res.json()
  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    ...tokens,
    expires_at: Date.now() + tokens.expires_in * 1000,
  }))
  return tokens
}

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

export async function teslaAPI(path, options = {}) {
  const tokens = getTokens()
  if (!tokens) throw new Error('Not authenticated')

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
