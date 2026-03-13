import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAlerts } from '../services/alerts.js';

const POLL_INTERVAL = 30000; // 30 seconds
const ALERT_RADIUS_MILES = 5;

export default function useAlerts(position, heading, radiusMiles = ALERT_RADIUS_MILES) {
  const [alerts, setAlerts] = useState([]);
  const [closestAlert, setClosestAlert] = useState(null);
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

      const reports = data.reports || [];

      setAlerts(reports);
      setClosestAlert(reports.length > 0 ? reports[0] : null);
      setSpeedLimit(data.speed_limit ?? null);
      setLastUpdated(data.last_updated ?? new Date().toISOString());
    } catch {
      // Silently fail -- keep stale data
    } finally {
      setLoading(false);
    }
  }, [position, heading, radiusMiles]);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  return { alerts, closestAlert, speedLimit, lastUpdated, loading, refresh };
}
