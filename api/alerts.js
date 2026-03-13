// GET /api/alerts?lat=&lng=&heading=&radius=
//
// Aggregates alerts from:
// 1. Waze LiveMap (multiple endpoint strategies)
// 2. OSM Overpass API for fixed speed/red-light cameras (cached 1 hr)
//
// Confidence scoring v2 with 4-factor engine:
//   - Age decay (6-tier)
//   - Confirmation count (5-tier)
//   - Cross-source validation
//   - Location history (hotspot DB)

const FIXED_CAMERA_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MIN_CONFIDENCE = 40;

const cameraCache = new Map();

// ── Location history / hotspot cache (in-memory) ────────────────────
// Key: rounded lat,lng (50m grid). Value: { count, timestamps[] }
const locationHistory = new Map();
const HISTORY_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const GRID_PRECISION = 4; // ~11m precision, cluster within 50m

function gridKey(lat, lng) {
  // Round to ~50m grid cells
  const factor = Math.pow(10, GRID_PRECISION);
  return `${Math.round(lat * factor) / factor},${Math.round(lng * factor) / factor}`;
}

function recordLocation(lat, lng) {
  const key = gridKey(lat, lng);
  const now = Date.now();
  const entry = locationHistory.get(key) || { count: 0, timestamps: [] };

  // Prune old timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < HISTORY_TTL);
  entry.timestamps.push(now);
  entry.count = entry.timestamps.length;

  locationHistory.set(key, entry);
}

function getLocationStats(lat, lng) {
  const key = gridKey(lat, lng);
  const entry = locationHistory.get(key);
  if (!entry) return { recentCount: 0, totalCount: 0 };

  const now = Date.now();
  const recentCount = entry.timestamps.filter((t) => now - t < HISTORY_TTL).length;
  return { recentCount, totalCount: entry.count };
}

// ── Haversine helpers ────────────────────────────────────────────────

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingCalc(lat1, lng1, lat2, lng2) {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function isAhead(userHeading, bearingToReport) {
  if (userHeading == null || userHeading === 0) return true;
  let diff = Math.abs(bearingToReport - userHeading) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff <= 90;
}

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

// ── Waze LiveMap — try multiple strategies ──────────────────────────

const WAZE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.waze.com/',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchWazeAlerts(bb, debug) {
  const urls = [
    `https://www.waze.com/live-map/api/georss?top=${bb.north}&bottom=${bb.south}&left=${bb.west}&right=${bb.east}&env=row&types=alerts`,
    `https://www.waze.com/row-georss/rss?top=${bb.north}&bottom=${bb.south}&left=${bb.west}&right=${bb.east}&env=row&types=alerts`,
    `https://www.waze.com/live-map/api/georss?top=${bb.north}&bottom=${bb.south}&left=${bb.west}&right=${bb.east}&env=na&types=alerts`,
  ];

  for (const url of urls) {
    try {
      debug.waze_urls_tried = debug.waze_urls_tried || [];
      debug.waze_urls_tried.push(url);

      const res = await fetch(url, { headers: WAZE_HEADERS });
      debug.waze_status = res.status;

      if (!res.ok) {
        debug.waze_error = `HTTP ${res.status}`;
        continue;
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        debug.waze_error = `Not JSON: ${text.slice(0, 200)}`;
        continue;
      }

      const alerts = data.alerts || [];
      debug.waze_raw_count = alerts.length;
      debug.waze_url_used = url;

      if (alerts.length === 0) {
        debug.waze_note = 'Waze returned 200 but 0 alerts';
        continue;
      }

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
    } catch (err) {
      debug.waze_error = err.message;
    }
  }

  return [];
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

async function fetchFixedCameras(bb, debug) {
  const cacheKey = `${bb.south.toFixed(3)},${bb.west.toFixed(3)},${bb.north.toFixed(3)},${bb.east.toFixed(3)}`;
  const cached = cameraCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < FIXED_CAMERA_CACHE_TTL) {
    debug.osm_source = 'cache';
    debug.osm_count = cached.data.length;
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
    debug.osm_status = res.status;
    if (!res.ok) {
      debug.osm_error = `HTTP ${res.status}`;
      return cached?.data || [];
    }
    const json = await res.json();
    const cameras = (json.elements || []).map((el) => ({
      id: `osm-${el.id}`,
      type: 'camera',
      lat: el.lat,
      lng: el.lon,
      reportedAt: Date.now(),
      confirmations: 10,
      description: el.tags?.description || 'Fixed speed camera',
      source: 'osm',
    }));
    debug.osm_source = 'live';
    debug.osm_count = cameras.length;
    cameraCache.set(cacheKey, { ts: Date.now(), data: cameras });
    return cameras;
  } catch (err) {
    debug.osm_error = err.message;
    return cached?.data || [];
  }
}

// ── Confidence scoring v2 — 4-factor engine ─────────────────────────

function scoreConfidence(report, allReports) {
  let score = 50; // base
  const factors = { age: 0, confirmations: 0, cross_source: 0, historical: 0 };

  // FACTOR 1 — Age decay (6-tier)
  const ageMs = Date.now() - report.reportedAt;
  const ageMin = ageMs / 60000;

  if (ageMin <= 5) {
    factors.age = 25;
  } else if (ageMin <= 10) {
    factors.age = 10;
  } else if (ageMin <= 20) {
    factors.age = 0;
  } else if (ageMin <= 25) {
    factors.age = -15;
  } else if (ageMin <= 30) {
    factors.age = -25;
  }
  // Over 30 min: handled by filter (remove entirely)

  score += factors.age;

  // FACTOR 2 — Confirmation count (5-tier)
  const conf = report.confirmations || 0;
  if (conf >= 10) {
    factors.confirmations = 25;
  } else if (conf >= 7) {
    factors.confirmations = 20;
  } else if (conf >= 4) {
    factors.confirmations = 15;
  } else if (conf >= 2) {
    factors.confirmations = 10;
  } else {
    factors.confirmations = 0;
  }

  score += factors.confirmations;

  // FACTOR 3 — Cross-source validation
  const sources = new Set([report.source]);
  for (const other of allReports) {
    if (other.id === report.id) continue;
    if (other.type !== report.type) continue;
    const dist = haversineDistance(report.lat, report.lng, other.lat, other.lng);
    if (dist < 0.1) {
      sources.add(other.source);
    }
  }

  if (sources.size >= 3) {
    factors.cross_source = 30; // All three sources
  } else if (sources.has('waze') && sources.has('google')) {
    factors.cross_source = 20; // Waze + Google Maps
  } else if (sources.has('waze') && sources.has('osm')) {
    factors.cross_source = 15; // Waze + OSM
  } else {
    factors.cross_source = 0;
  }

  score += factors.cross_source;

  // FACTOR 4 — Location history
  const stats = getLocationStats(report.lat, report.lng);
  if (stats.totalCount >= 10) {
    factors.historical = 20; // Known hotspot
  } else if (stats.totalCount >= 3) {
    factors.historical = 15; // Recurring location
  } else if (stats.recentCount >= 1) {
    factors.historical = 10; // Recent history
  } else {
    factors.historical = 0;
  }

  score += factors.historical;

  // OSM cameras always high confidence
  if (report.source === 'osm') score = Math.max(score, 85);

  // Clamp
  score = Math.max(0, Math.min(100, score));

  return { score, factors };
}

function confidenceLabel(score) {
  if (score >= 90) return 'Confirmed';
  if (score >= 70) return 'Likely';
  return 'Reported';
}

// ── Google Roads API speed limit ──────────────────────────────────────

const GOOGLE_ROADS_KEY = process.env.GOOGLE_ROADS_API_KEY || '';

async function fetchSpeedLimit(lat, lng, debug) {
  if (!GOOGLE_ROADS_KEY) {
    debug.speed_limit_note = 'No GOOGLE_ROADS_API_KEY';
    return null;
  }

  try {
    const snapUrl =
      `https://roads.googleapis.com/v1/nearestRoads` +
      `?points=${lat},${lng}&key=${GOOGLE_ROADS_KEY}`;
    const snapRes = await fetch(snapUrl);
    if (!snapRes.ok) {
      debug.speed_limit_error = `Snap HTTP ${snapRes.status}`;
      return null;
    }
    const snapData = await snapRes.json();

    const placeId = snapData.snappedPoints?.[0]?.placeId;
    if (!placeId) return null;

    const limitUrl =
      `https://roads.googleapis.com/v1/speedLimits` +
      `?placeId=${placeId}&key=${GOOGLE_ROADS_KEY}`;
    const limitRes = await fetch(limitUrl);
    if (!limitRes.ok) return null;
    const limitData = await limitRes.json();

    const limit = limitData.speedLimits?.[0];
    if (!limit) return null;

    const speedMph =
      limit.units === 'KPH'
        ? Math.round(limit.speedLimit * 0.621371)
        : limit.speedLimit;

    return speedMph;
  } catch (err) {
    debug.speed_limit_error = err.message;
    return null;
  }
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

  const debug = {
    input: { lat, lng, heading, radius },
    bounding_box: bb,
  };

  // Fetch all sources in parallel
  const [wazeAlerts, fixedCameras, speedLimit] = await Promise.all([
    fetchWazeAlerts(bb, debug),
    fetchFixedCameras(bb, debug),
    fetchSpeedLimit(lat, lng, debug),
  ]);

  const allReports = [...wazeAlerts, ...fixedCameras];
  debug.total_raw = allReports.length;

  // Record locations for hotspot tracking
  for (const r of allReports) {
    recordLocation(r.lat, r.lng);
  }

  const now = Date.now();
  const mapped = allReports.map((r) => {
    const distance = haversineDistance(lat, lng, r.lat, r.lng);
    const bear = bearingCalc(lat, lng, r.lat, r.lng);
    const headingRelevant = isAhead(heading, bear);
    const age = Math.round((now - r.reportedAt) / 60000);
    const { score, factors } = scoreConfidence(r, allReports);
    return {
      id: r.id,
      type: r.type,
      lat: r.lat,
      lng: r.lng,
      distance: Math.round(distance * 100) / 100,
      bearing: Math.round(bear),
      confidence: score,
      confidence_label: confidenceLabel(score),
      confidence_factors: factors,
      age,
      sources: [r.source],
      heading_relevant: headingRelevant,
      description: r.description,
    };
  });

  debug.before_filter = mapped.length;

  const reports = mapped
    .filter((r) => {
      // Over 30 min: remove entirely (except cameras)
      if (r.type !== 'camera' && r.age > 30) return false;
      // Never show below 40 confidence
      if (r.confidence < MIN_CONFIDENCE) return false;
      if (!r.heading_relevant) return false;
      if (r.distance > radius) return false;
      return true;
    })
    .sort((a, b) => {
      const maxDist = radius || 5;
      const proxA = 1 - a.distance / maxDist;
      const proxB = 1 - b.distance / maxDist;
      const scoreA = a.confidence * 0.6 + proxA * 100 * 0.4;
      const scoreB = b.confidence * 0.6 + proxB * 100 * 0.4;
      return scoreB - scoreA;
    });

  debug.after_filter = reports.length;

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=10');

  return res.status(200).json({
    reports,
    speed_limit: speedLimit,
    last_updated: new Date().toISOString(),
    _debug: debug,
  });
}
