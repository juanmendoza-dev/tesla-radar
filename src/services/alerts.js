// Fetches nearby police/hazard alerts from the backend API.
// Falls back to mock data during development or when the API is unavailable.

const API_URL = '/api/alerts';

export async function fetchAlerts(lat, lng, heading, radiusMiles) {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radiusMiles),
    });
    if (heading != null) {
      params.set('heading', String(heading));
    }

    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    // In development or when API is unavailable, return mock data
    return {
      reports: generateMockAlerts(lat, lng, radiusMiles),
      speed_limit: null,
      last_updated: new Date().toISOString(),
    };
  }
}

// Generate realistic mock alerts around current position for dev/demo
function generateMockAlerts(lat, lng, radiusMiles) {
  const types = ['police', 'speed_trap', 'police', 'hazard', 'accident', 'police'];
  const streets = [
    'Highway 101', 'Main St', 'Interstate 280', 'El Camino Real',
    'Market St', 'Broadway', 'Oak Ave', 'Pine St',
  ];
  const count = 4 + Math.floor(Math.random() * 5);
  const alerts = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = Math.random() * radiusMiles * 0.8;
    const dLat = (dist / 69) * Math.cos(angle);
    const dLng = (dist / (69 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);

    const age = Math.floor(Math.random() * 25); // minutes
    alerts.push({
      id: `mock-${i}-${Date.now()}`,
      type: types[i % types.length],
      lat: lat + dLat,
      lng: lng + dLng,
      distance: Math.round(dist * 100) / 100,
      bearing: Math.round((angle * 180) / Math.PI + 360) % 360,
      confidence: 50 + Math.floor(Math.random() * 40),
      age,
      sources: ['mock'],
      heading_relevant: true,
      description: streets[i % streets.length],
    });
  }

  return alerts;
}
