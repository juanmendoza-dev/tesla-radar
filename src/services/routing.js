// Routing service using OSRM (free, no API key needed)
// Provides route geometry + turn-by-turn instructions

const OSRM_BASE = 'https://router.project-osrm.org'

export async function fetchRoute(fromLat, fromLng, toLat, toLng) {
  const url = `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`)
  const data = await res.json()

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found')
  }

  const route = data.routes[0]
  const legs = route.legs || []
  const steps = legs.flatMap((leg) => leg.steps || [])

  // Parse turn-by-turn instructions
  const turns = steps.map((step) => ({
    maneuver: mapManeuverType(step.maneuver?.type, step.maneuver?.modifier),
    distance: formatDistance(step.distance),
    distanceMeters: step.distance,
    street: step.name || '',
    duration: step.duration,
  }))

  return {
    geometry: route.geometry,
    distance: route.distance, // meters
    duration: route.duration, // seconds
    turns,
  }
}

function mapManeuverType(type, modifier) {
  if (type === 'arrive') return 'arrive'
  if (type === 'depart') return 'straight'

  if (type === 'turn' || type === 'end of road' || type === 'fork') {
    if (modifier?.includes('sharp') && modifier?.includes('left')) return 'sharp-left'
    if (modifier?.includes('sharp') && modifier?.includes('right')) return 'sharp-right'
    if (modifier?.includes('slight') && modifier?.includes('left')) return 'slight-left'
    if (modifier?.includes('slight') && modifier?.includes('right')) return 'slight-right'
    if (modifier?.includes('left')) return 'turn-left'
    if (modifier?.includes('right')) return 'turn-right'
    if (modifier?.includes('uturn')) return 'uturn'
  }

  if (type === 'merge') return 'merge'
  if (type === 'roundabout') return 'turn-right'

  return 'straight'
}

function formatDistance(meters) {
  const miles = meters * 0.000621371
  if (miles < 0.1) {
    const feet = Math.round(meters * 3.28084 / 50) * 50
    return `${feet} ft`
  }
  return `${miles.toFixed(1)} mi`
}

export function calculateETA(durationSeconds) {
  const minutes = Math.round(durationSeconds / 60)
  const arrival = new Date(Date.now() + durationSeconds * 1000)
  const arrivalTime = arrival.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return { minutes, arrivalTime }
}

export function isOffRoute(position, routeGeometry, thresholdMiles = 0.05) {
  if (!routeGeometry || !routeGeometry.coordinates) return false

  const coords = routeGeometry.coordinates
  let minDist = Infinity

  // Check distance to nearest route segment (sample every 5th point for performance)
  for (let i = 0; i < coords.length; i += 5) {
    const [lng, lat] = coords[i]
    const dist = quickDistance(position.lat, position.lng, lat, lng)
    if (dist < minDist) minDist = dist
  }

  return minDist > thresholdMiles
}

// Fast approximate distance in miles (no trig for nearby points)
function quickDistance(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * 69
  const dLng = (lng2 - lng1) * 69 * Math.cos(lat1 * Math.PI / 180)
  return Math.sqrt(dLat * dLat + dLng * dLng)
}
