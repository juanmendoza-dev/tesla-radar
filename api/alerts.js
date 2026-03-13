// GET /api/alerts?lat=&lng=&heading=&radius=
//
// Aggregates alerts from:
// 1. Waze LiveMap georss (POLICE, SPEED_TRAP, HAZARD)
// 2. OSM Overpass API for fixed speed/red-light cameras (cached 1 hr)
//
// Confidence scoring, heading filter, proximity sort — see inline comments.

const FIXED_CAMERA_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_REPORT_AGE_MS = 30 * 60 * 1000; // 30 minutes
const MIN_CONFIDENCE = 40;

// In-memory cache for fixed cameras (per bounding-box key)
const cameraCache = new Map();

// ── Haversine helpers ────────────────────────────────────────────────

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1, lng1, lat2, lng2) {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Returns true if the report is roughly ahead of the user (within ±90 degrees)
function isAhead(userHeading, bearingToReport) {
  if (userHeading == null) return true; // no heading → include everything
  let diff = Math.abs(bearingToReport - userHeading) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff <= 90;
}

// ── Bounding box from center + radius ────────────────────────────────

function boundingBox(lat, lng, radiusMiles) {
  const dLat = radiusMiles / 69;
  const dLng = radiusMiles / (69 * Math.cos(toRad(lat)));
  return {
    north: lat + dLat,
    south: lat - dLat,
    east: lng + dLng,
    west: lng - dLng,
  };
}

// ── Waze LiveMap georss ──────────────────────────────────────────────

async function fetchWazeAlerts(bb) {
  const url =
    `https://www.waze.com/live-map/api/georss` +
    `?top=${bb.north}&bottom=${bb.south}&left=${bb.west}&right=${bb.east}` +
    `&env=row&types=alerts`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://www.waze.com/live-map',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const alerts = data.alerts || [];
    return alerts.map((a) => ({
      id: a.uuid || a.id || `waze-${Date.now()}-${Math.random()}`,
      type: mapWazeType(a.type, a.subtype),
      lat: a.location?.y ?? a.lat,
      lng: a.location?.x ?? a.lng,
      reportedAt: a.pubMillis || Date.now(),
      confirmations: a.nThumbsUp || 0,
      description: a.street || a.description || '',
      source: 'waze',
    }));
  } catch {
    return [];
  }
}

function mapWazeType(type, subtype) {
  const t = ((type || '') + ' ' + (subtype || '')).toUpperCase();
  if (t.includes('POLICE')) return 'police';
  if (t.includes('SPEED') || t.includes('CAMERA')) return 'speed_trap';
  if (t.includes('HAZARD')) return 'hazard';
  if (t.includes('ACCIDENT') || t.includes('CRASH')) return 'accident';
  return 'other';
}

// ── OSM Overpass fixed cameras ───────────────────────────────────────

async function fetchFixedCameras(bb) {
  const cacheKey = `${bb.south.toFixed(3)},${bb.west.toFixed(3)},${bb.north.toFixed(3)},${bb.east.toFixed(3)}`;
  const cached = cameraCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < FIXED_CAMERA_CACHE_TTL) {
    return cached.data;
  }

  const query = `
    [out:json][timeout:10];
    (
      node["highway"="speed_camera"](${bb.south},${bb.west},${bb.north},${bb.east});
      node["enforcement"="speed_camera"](${bb.south},${bb.west},${bb.north},${bb.east});
    );
    out body;
  `.trim();

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return cached?.data || [];
    const json = await res.json();
    const cameras = (json.elements || []).map((el) => ({
      id: `osm-${el.id}`,
      type: 'speed_camera',
      lat: el.lat,
      lng: el.lon,
      reportedAt: Date.now(),
      confirmations: 10, // fixed infrastructure — high trust
      description: el.tags?.description || 'Fixed speed camera',
      source: 'osm',
    }));
    cameraCache.set(cacheKey, { ts: Date.now(), data: cameras });
    return cameras;
  } catch {
    return cached?.data || [];
  }
}

// ── Confidence scoring ───────────────────────────────────────────────

function scoreConfidence(report, allReports) {
  let score = 50;

  // +20 if confirmed by 2+ users
  if (report.confirmations >= 2) score += 20;

  const ageMs = Date.now() - report.reportedAt;
  const ageMin = ageMs / 60000;

  // +15 if reported within last 5 min
  if (ageMin <= 5) score += 15;

  // -10 per 10 minutes of age
  score -= Math.floor(ageMin / 10) * 10;

  // +20 if appears in 2+ sources (same type within ~0.1 mi)
  const crossSource = allReports.some(
    (other) =>
      other.id !== report.id &&
      other.source !== report.source &&
      other.type === report.type &&
      haversineDistance(report.lat, report.lng, other.lat, other.lng) < 0.1
  );
  if (crossSource) score += 20;

  // Fixed cameras always get high confidence
  if (report.source === 'osm') score = Math.max(score, 85);

  return Math.max(0, Math.min(100, score));
}

// ── Main handler ─────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const heading = req.query.heading != null ? parseFloat(req.query.heading) : null;
  const radius = parseFloat(req.query.radius) || 5;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const bb = boundingBox(lat, lng, radius);

  // Fetch in parallel
  const [wazeAlerts, fixedCameras] = await Promise.all([
    fetchWazeAlerts(bb),
    fetchFixedCameras(bb),
  ]);

  const allReports = [...wazeAlerts, ...fixedCameras];

  const now = Date.now();
  const reports = allReports
    .map((r) => {
      const distance = haversineDistance(lat, lng, r.lat, r.lng);
      const bear = bearing(lat, lng, r.lat, r.lng);
      const headingRelevant = isAhead(heading, bear);
      const age = Math.round((now - r.reportedAt) / 60000); // minutes
      const confidence = scoreConfidence(r, allReports);
      return {
        id: r.id,
        type: r.type,
        lat: r.lat,
        lng: r.lng,
        distance: Math.round(distance * 100) / 100,
        bearing: Math.round(bear),
        confidence,
        age,
        sources: [r.source],
        heading_relevant: headingRelevant,
        description: r.description,
      };
    })
    // Filter: older than 30 min (except fixed cameras), below confidence 40, behind user
    .filter((r) => {
      if (r.type !== 'speed_camera' && r.age > 30) return false;
      if (r.confidence < MIN_CONFIDENCE) return false;
      if (!r.heading_relevant) return false;
      if (r.distance > radius) return false;
      return true;
    })
    // Sort by weighted score: confidence*0.6 + proximity*0.4
    // Proximity is inverted: closer = higher score
    .sort((a, b) => {
      const maxDist = radius || 5;
      const proxA = 1 - a.distance / maxDist;
      const proxB = 1 - b.distance / maxDist;
      const scoreA = a.confidence * 0.6 + proxA * 100 * 0.4;
      const scoreB = b.confidence * 0.6 + proxB * 100 * 0.4;
      return scoreB - scoreA;
    });

  // Edge caching
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=10');

  return res.status(200).json({
    reports,
    speed_limit: null, // Phase 2: integrate speed-limit lookup
    last_updated: new Date().toISOString(),
  });
}
