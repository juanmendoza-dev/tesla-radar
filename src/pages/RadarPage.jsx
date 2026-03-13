import RadarMap from '../components/RadarMap.jsx'
import AlertPill from '../components/AlertPill.jsx'
import TopBar from '../components/TopBar.jsx'
import BottomHUD from '../components/BottomHUD.jsx'
import SidePanel from '../components/SidePanel.jsx'
import useGeolocation from '../hooks/useGeolocation.js'
import useAlerts from '../hooks/useAlerts.js'
import useNavigation from '../hooks/useNavigation.js'
import usePlaces from '../hooks/usePlaces.js'
import { getBearingLabel } from '../services/geo.js'

export default function RadarPage() {
  const { position, speed, heading, error: geoError } = useGeolocation()
  const { alerts, closestAlert, speedLimit, loading, refresh } = useAlerts(position, heading, 5)
  const { route, navigation, destination, startNavigation, stopNavigation } = useNavigation(position)
  usePlaces() // Load Google Places API

  // Enrich alerts with direction labels
  const enrichedAlerts = alerts.map((a) => ({
    ...a,
    direction: a.bearing != null ? getBearingLabel(a.bearing) : '',
  }))

  const enrichedClosest = closestAlert
    ? { ...closestAlert, direction: closestAlert.bearing != null ? getBearingLabel(closestAlert.bearing) : '' }
    : null

  // Only show alert pill for close police/speed traps
  const pillAlert = enrichedClosest &&
    (enrichedClosest.type === 'police' || enrichedClosest.type === 'speed_trap') &&
    enrichedClosest.distance < 1
    ? enrichedClosest
    : null

  const handleSelectDestination = (place) => {
    startNavigation(place)
  }

  if (geoError) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#000' }}>
        <div className="text-center p-8 max-w-md">
          <h1
            className="text-xl mb-3"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#fff' }}
          >
            Location Required
          </h1>
          <p className="text-sm mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}>
            Tesla Radar needs access to your location to show nearby alerts.
          </p>
          <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.15)' }}>
            {geoError}
          </p>
        </div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#000' }}>
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full mx-auto mb-4"
            style={{
              border: '2px solid #00b4ff',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}
          >
            Acquiring location...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: '#000' }}>
      {/* Fullscreen map */}
      <RadarMap
        position={position}
        alerts={enrichedAlerts}
        heading={heading}
        route={route}
      />

      {/* Floating overlays */}
      <AlertPill alert={pillAlert} />
      <TopBar navigation={navigation} />
      <BottomHUD speed={speed} speedLimit={speedLimit} heading={heading} />
      <SidePanel
        alerts={enrichedAlerts}
        loading={loading}
        onRefresh={refresh}
        onSelectDestination={handleSelectDestination}
        destination={destination}
        navigation={navigation}
      />
    </div>
  )
}
