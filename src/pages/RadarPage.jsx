import { useState } from 'react'
import RadarMap from '../components/RadarMap.jsx'
import AlertBanner from '../components/AlertBanner.jsx'
import SidePanel from '../components/SidePanel.jsx'
import SpeedOverlay from '../components/SpeedOverlay.jsx'
import useGeolocation from '../hooks/useGeolocation.js'
import useAlerts from '../hooks/useAlerts.js'

export default function RadarPage() {
  const [radius] = useState(5)
  const { position, speed, heading, error: geoError } = useGeolocation()
  const { alerts, closestAlert, loading, refresh } = useAlerts(position, radius)

  if (geoError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-4">📍</div>
          <h1 className="text-xl font-bold mb-2">Location Required</h1>
          <p className="text-white/50 text-sm mb-4">
            Tesla Radar needs access to your location to show nearby alerts.
          </p>
          <p className="text-white/30 text-xs">
            Error: {geoError}
          </p>
        </div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Acquiring location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex relative overflow-hidden">
      {/* Main map area */}
      <div className="flex-1 relative">
        <RadarMap position={position} alerts={alerts} heading={heading} />
        <AlertBanner alert={closestAlert} />
        <SpeedOverlay speed={speed} />
      </div>

      {/* Right side panel */}
      <SidePanel alerts={alerts} loading={loading} onRefresh={refresh} />
    </div>
  )
}
