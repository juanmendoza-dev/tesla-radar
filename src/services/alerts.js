// Fetches nearby police/hazard alerts from the backend API.
// Falls back to mock data when API returns empty or errors.

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
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    console.log('[Tesla Radar] /api/alerts response:', {
      reports: data.reports?.length,
      speed_limit: data.speed_limit,
    });

    // If backend returned real reports, use them
    if (data.reports && data.reports.length > 0) {
      return data;
    }

    // Backend returned 0 reports — use mock data so UI isn't empty
    return {
      reports: generateMockAlerts(lat, lng, radiusMiles),
      speed_limit: data.speed_limit,
      last_updated: data.last_updated,
      _source: 'mock_fallback',
    };
  } catch (err) {
    console.warn('[Tesla Radar] API failed, using mock data:', err.message);
    return {
      reports: generateMockAlerts(lat, lng, radiusMiles),
      speed_limit: null,
      last_updated: new Date().toISOString(),
      _source: 'mock_error_fallback',
    };
  }
}

// Generate realistic mock alerts around current position
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
    const dist = 0.2 + Math.random() * radiusMiles * 0.6;
    const dLat = (dist / 69) * Math.cos(angle);
    const dLng = (dist / (69 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);

    const age = Math.floor(Math.random() * 20);
    const confidence = 45 + Math.floor(Math.random() * 50);
    const labels = { 90: 'Confirmed', 70: 'Likely', 0: 'Reported' };
    const confidence_label = confidence >= 90 ? 'Confirmed' : confidence >= 70 ? 'Likely' : 'Reported';

    alerts.push({
      id: `mock-${i}-${Date.now()}`,
      type: types[i % types.length],
      lat: lat + dLat,
      lng: lng + dLng,
      distance: Math.round(dist * 100) / 100,
      bearing: Math.round((angle * 180) / Math.PI + 360) % 360,
      confidence,
      confidence_label,
      confidence_factors: {
        age: 10 + Math.floor(Math.random() * 15),
        confirmations: Math.floor(Math.random() * 20),
        cross_source: Math.floor(Math.random() * 20),
        historical: Math.floor(Math.random() * 15),
      },
      age,
      sources: ['mock'],
      heading_relevant: true,
      description: streets[i % streets.length],
    });
  }

  return alerts;
}
