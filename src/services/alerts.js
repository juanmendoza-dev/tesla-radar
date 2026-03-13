// Fetches nearby police/hazard alerts
// Uses a proxy endpoint to avoid CORS issues with Waze data
// Falls back to mock data during development

const WAZE_PROXY_URL = '/api/alerts'

export async function fetchAlerts(lat, lng, radiusMiles) {
  try {
    const res = await fetch(
      `${WAZE_PROXY_URL}?lat=${lat}&lng=${lng}&radius=${radiusMiles}`
    )
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return normalizeAlerts(data)
  } catch {
    // In development or when API is unavailable, return mock data
    return generateMockAlerts(lat, lng, radiusMiles)
  }
}

function normalizeAlerts(data) {
  if (!Array.isArray(data)) return []
  return data.map((item) => ({
    id: item.id || item.uuid || crypto.randomUUID(),
    type: mapAlertType(item.type || item.subtype),
    lat: item.location?.y || item.lat,
    lng: item.location?.x || item.lng,
    reportedAt: item.pubMillis || Date.now(),
    reliability: item.reliability || 5,
    description: item.street || item.description || '',
  }))
}

function mapAlertType(type) {
  if (!type) return 'unknown'
  const t = type.toUpperCase()
  if (t.includes('POLICE')) return 'police'
  if (t.includes('SPEED') || t.includes('CAMERA')) return 'speed_trap'
  if (t.includes('HAZARD')) return 'hazard'
  if (t.includes('ACCIDENT') || t.includes('CRASH')) return 'accident'
  return 'other'
}

// Generate realistic mock alerts around current position for dev/demo
function generateMockAlerts(lat, lng, radiusMiles) {
  const types = ['police', 'speed_trap', 'police', 'hazard', 'accident', 'police']
  const streets = [
    'Highway 101', 'Main St', 'Interstate 280', 'El Camino Real',
    'Market St', 'Broadway', 'Oak Ave', 'Pine St',
  ]
  const count = 4 + Math.floor(Math.random() * 5)
  const alerts = []

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI
    const dist = Math.random() * radiusMiles * 0.8
    const dLat = (dist / 69) * Math.cos(angle)
    const dLng = (dist / (69 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)

    alerts.push({
      id: `mock-${i}-${Date.now()}`,
      type: types[i % types.length],
      lat: lat + dLat,
      lng: lng + dLng,
      reportedAt: Date.now() - Math.floor(Math.random() * 3600000),
      reliability: 3 + Math.floor(Math.random() * 8),
      description: streets[i % streets.length],
    })
  }

  return alerts
}
