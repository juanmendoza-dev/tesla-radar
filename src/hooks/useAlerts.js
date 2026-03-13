import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchAlerts } from '../services/alerts.js';
import { getDistance, getBearing } from '../services/geo.js';

const POLL_INTERVAL = 30000; // 30 seconds
const ALERT_RADIUS_MILES = 5;

export default function useAlerts(position, heading, radiusMiles = ALERT_RADIUS_MILES) {
  const [rawAlerts, setRawAlerts] = useState([]);
  const [speedLimit, setSpeedLimit] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!position) return;
    setLoading(true);
    try {
      const data = await fetchAlerts(
        position.lat,
        position.lng,
        heading,
        radiusMiles
      );

      setRawAlerts(data.reports || []);
      setSpeedLimit(data.speed_limit ?? null);
      setLastUpdated(data.last_updated ?? new Date().toISOString());
    } catch {
      // Silently fail — keep stale data
    } finally {
      setLoading(false);
    }
  }, [position, heading, radiusMiles]);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  // ── Real-time distance + bearing recalculation on every position change ──
  const alerts = useMemo(() => {
    if (!position || rawAlerts.length === 0) return rawAlerts;

    return rawAlerts.map((alert) => ({
      ...alert,
      distance: Math.round(
        getDistance(position.lat, position.lng, alert.lat, alert.lng) * 100
      ) / 100,
      bearing: Math.round(
        getBearing(position.lat, position.lng, alert.lat, alert.lng)
      ),
    })).sort((a, b) => a.distance - b.distance);
  }, [rawAlerts, position]);

  const closestAlert = alerts.length > 0 ? alerts[0] : null;

  return { alerts, closestAlert, speedLimit, lastUpdated, loading, refresh };
}
