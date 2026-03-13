import { useState } from 'react'
import RadarMap from '../components/RadarMap.jsx'
import AlertBanner from '../components/AlertBanner.jsx'
import SidePanel from '../components/SidePanel.jsx'
import SpeedOverlay from '../components/SpeedOverlay.jsx'
import Compass from '../components/Compass.jsx'
import useGeolocation from '../hooks/useGeolocation.js'
import useAlerts from '../hooks/useAlerts.js'
import { getBearingLabel } from '../services/geo.js'

export default function RadarPage() {
  const [radius, setRadius] = useState(5)
  const { position, speed, heading, error: geoError } = useGeolocation()
  const { alerts, closestAlert, speedLimit, loading, refresh } = useAlerts(position, heading, radius)

  // Enrich alerts with direction labels for display
  const enrichedAlerts = alerts.map((a) => ({
    ...a,
    direction: a.bearing != null ? getBearingLabel(a.bearing) : '',
  }))

  const enrichedClosest = closestAlert
    ? { ...closestAlert, direction: closestAlert.bearing != null ? getBearingLabel(closestAlert.bearing) : '' }
    : null

  if (geoError) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-6">📍</div>
          <h1
            className="text-xl mb-3"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            Location Required
          </h1>
          <p className="text-sm mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            Tesla Radar needs access to your location to show nearby alerts.
          </p>
          <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            {geoError}
          </p>
        </div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full mx-auto mb-4"
            style={{
              border: '2px solid var(--accent)',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
          >
            Acquiring location...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Fullscreen map */}
      <RadarMap position={position} alerts={enrichedAlerts} heading={heading} />

      {/* Floating overlays */}
      <AlertBanner alert={enrichedClosest} />
      <SpeedOverlay speed={speed} speedLimit={speedLimit} />
      <Compass heading={heading} />
      <SidePanel
        alerts={enrichedAlerts}
        loading={loading}
        onRefresh={refresh}
        radius={radius}
        onRadiusChange={setRadius}
      />
    </div>
  )
}
