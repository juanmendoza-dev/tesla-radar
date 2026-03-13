import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

const ALERT_COLORS = {
  police: '#ef4444',
  speed_trap: '#eab308',
  hazard: '#f97316',
  accident: '#a855f7',
  other: '#6b7280',
  unknown: '#6b7280',
}

const ALERT_ICONS = {
  police: '🚔',
  speed_trap: '📸',
  hazard: '⚠️',
  accident: '💥',
  other: '❗',
  unknown: '❗',
}

// Dark map style using free tiles
const MAP_STYLE = {
  version: 8,
  name: 'Tesla Radar Dark',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

export default function RadarMap({ position, alerts, heading }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const alertMarkersRef = useRef([])

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: position ? [position.lng, position.lat] : [-122.4194, 37.7749],
      zoom: 14,
      attributionControl: false,
      pitchWithRotate: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update user position marker
  useEffect(() => {
    if (!mapRef.current || !position) return

    if (!markerRef.current) {
      const el = document.createElement('div')
      el.className = 'user-marker'
      el.innerHTML = `
        <div style="
          width: 20px; height: 20px;
          background: #3b82f6;
          border: 3px solid #93c5fd;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(59,130,246,0.6), 0 0 24px rgba(59,130,246,0.3);
        "></div>
        <div class="heading-arrow" style="
          position: absolute; top: -8px; left: 50%;
          transform: translateX(-50%) rotate(0deg);
          width: 0; height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 10px solid #3b82f6;
          transform-origin: center bottom;
        "></div>
      `
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([position.lng, position.lat])
        .addTo(mapRef.current)
    } else {
      markerRef.current.setLngLat([position.lng, position.lat])
    }

    // Update heading arrow
    const arrow = markerRef.current.getElement().querySelector('.heading-arrow')
    if (arrow && heading) {
      arrow.style.transform = `translateX(-50%) rotate(${heading}deg)`
    }

    // Smoothly follow user
    mapRef.current.easeTo({
      center: [position.lng, position.lat],
      duration: 1000,
    })
  }, [position, heading])

  // Update alert markers
  useEffect(() => {
    if (!mapRef.current) return

    // Clear old markers
    alertMarkersRef.current.forEach((m) => m.remove())
    alertMarkersRef.current = []

    if (!alerts) return

    alerts.forEach((alert) => {
      const color = ALERT_COLORS[alert.type] || ALERT_COLORS.unknown
      const icon = ALERT_ICONS[alert.type] || ALERT_ICONS.unknown

      const el = document.createElement('div')
      el.style.cssText = `
        display: flex; align-items: center; justify-content: center;
        width: 36px; height: 36px;
        background: ${color}22;
        border: 2px solid ${color};
        border-radius: 50%;
        font-size: 18px;
        cursor: pointer;
        box-shadow: 0 0 8px ${color}44;
        transition: transform 0.2s;
      `
      el.textContent = icon
      el.title = `${alert.type} — ${alert.description} (${alert.distance} mi)`

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([alert.lng, alert.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: 'radar-popup' })
            .setHTML(`
              <div style="background:#16161f;color:#f0f0f5;padding:8px 12px;border-radius:8px;font-size:13px;">
                <strong style="color:${color}">${alert.type.replace('_', ' ').toUpperCase()}</strong><br/>
                ${alert.description}<br/>
                <span style="color:#8888a0">${alert.distance} mi ${alert.direction}</span>
              </div>
            `)
        )
        .addTo(mapRef.current)

      alertMarkersRef.current.push(marker)
    })
  }, [alerts])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
