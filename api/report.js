// POST /api/report
// Body: { type, lat, lng, description }
// Simple in-memory store — no persistent DB yet.

const reports = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, lat, lng, description } = req.body || {};

  if (!type || lat == null || lng == null) {
    return res.status(400).json({ error: 'type, lat, and lng are required' });
  }

  const report = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    description: description || '',
    reportedAt: Date.now(),
  };

  reports.push(report);

  // Trim old reports to avoid unbounded memory growth
  const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
  while (reports.length > 0 && reports[0].reportedAt < cutoff) {
    reports.shift();
  }

  return res.status(201).json({
    ok: true,
    report,
  });
}
