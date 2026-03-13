import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAlerts } from '../services/alerts.js'
import { getDistance, getBearing, getBearingLabel } from '../services/geo.js'

const POLL_INTERVAL = 30000 // 30 seconds
const ALERT_RADIUS_MILES = 5

export default function useAlerts(position, radiusMiles = ALERT_RADIUS_MILES) {
  const [alerts, setAlerts] = useState([])
  const [closestAlert, setClosestAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef(null)

  const refresh = useCallback(async () => {
    if (!position) return
    setLoading(true)
    try {
      const raw = await fetchAlerts(position.lat, position.lng, radiusMiles)
      const enriched = raw
        .map((alert) => {
          const distance = getDistance(
            position.lat, position.lng,
            alert.lat, alert.lng
          )
          const bearing = getBearing(
            position.lat, position.lng,
            alert.lat, alert.lng
          )
          return {
            ...alert,
            distance: Math.round(distance * 10) / 10,
            direction: getBearingLabel(bearing),
          }
        })
        .filter((a) => a.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance)

      setAlerts(enriched)
      setClosestAlert(enriched.length > 0 ? enriched[0] : null)
    } catch {
      // Silently fail — keep stale data
    } finally {
      setLoading(false)
    }
  }, [position, radiusMiles])

  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [refresh])

  return { alerts, closestAlert, loading, refresh }
}
