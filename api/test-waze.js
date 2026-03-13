// GET /api/test-waze — raw Waze response for debugging
// Hardcoded to Miami, FL for testing (busy city, lots of reports)

export default async function handler(req, res) {
  const lat = parseFloat(req.query.lat) || 25.7617;
  const lng = parseFloat(req.query.lng) || -80.1918;
  const radius = parseFloat(req.query.radius) || 5;

  const dLat = radius / 69;
  const dLng = radius / (69 * Math.cos((lat * Math.PI) / 180));
  const bb = {
    north: lat + dLat,
    south: lat - dLat,
    east: lng + dLng,
    west: lng - dLng,
  };

  const url =
    `https://www.waze.com/live-map/api/georss` +
    `?top=${bb.north}&bottom=${bb.south}&left=${bb.west}&right=${bb.east}` +
    `&env=row&types=alerts`;

  const debug = {
    url_called: url,
    bounding_box: bb,
    waze_status: null,
    waze_headers: null,
    waze_body_preview: null,
    alert_count: 0,
    error: null,
  };

  try {
    const wazeRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://www.waze.com/',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    debug.waze_status = wazeRes.status;
    debug.waze_headers = Object.fromEntries(wazeRes.headers.entries());

    const text = await wazeRes.text();

    try {
      const json = JSON.parse(text);
      debug.alert_count = (json.alerts || []).length;
      debug.waze_body_preview = {
        keys: Object.keys(json),
        alert_count: (json.alerts || []).length,
        jam_count: (json.jams || []).length,
        first_3_alerts: (json.alerts || []).slice(0, 3),
      };
    } catch {
      debug.waze_body_preview = text.slice(0, 500);
      debug.error = 'Response is not valid JSON';
    }
  } catch (err) {
    debug.error = err.message;
  }

  return res.status(200).json(debug);
}
