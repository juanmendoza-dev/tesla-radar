import { useState, useEffect, useRef, useCallback } from 'react'

// GPS smoothing factor (0 = full smoothing, 1 = no smoothing)
const SMOOTH_FACTOR = 0.25
// Minimum distance (miles) between two GPS fixes to compute bearing from movement
const MIN_BEARING_DISTANCE = 0.005 // ~26 feet

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function computeBearing(lat1, lng1, lat2, lng2) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng)
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360
}

// ── Dev mode: simulate driving along a route ────────────────────────

function useDevSimulator(enabled) {
  const [simPosition, setSimPosition] = useState(null)
  const [simSpeed, setSimSpeed] = useState(0)
  const [simHeading, setSimHeading] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    // Simulate a loop around San Francisco
    const waypoints = [
      { lat: 37.7749, lng: -122.4194 }, // Market St
      { lat: 37.7751, lng: -122.4100 },
      { lat: 37.7780, lng: -122.4050 },
      { lat: 37.7820, lng: -122.4020 }, // Financial District
      { lat: 37.7860, lng: -122.4000 },
      { lat: 37.7880, lng: -122.4050 },
      { lat: 37.7870, lng: -122.4120 }, // North Beach
      { lat: 37.7840, lng: -122.4160 },
      { lat: 37.7800, lng: -122.4180 },
      { lat: 37.7760, lng: -122.4190 },
      { lat: 37.7749, lng: -122.4194 }, // Back to start
    ]

    let waypointIndex = 0
    let progress = 0 // 0-1 between current and next waypoint
    const SPEED_MPH = 35
    const TICK_MS = 50
    // Approximate distance per tick in degrees
    const DEG_PER_TICK = (SPEED_MPH / 3600) * (TICK_MS / 1000) / 69

    const tick = () => {
      const from = waypoints[waypointIndex]
      const to = waypoints[(waypointIndex + 1) % waypoints.length]

      // Distance between waypoints
      const segLat = to.lat - from.lat
      const segLng = to.lng - from.lng
      const segLen = Math.sqrt(segLat * segLat + segLng * segLng)

      progress += DEG_PER_TICK / segLen
      if (progress >= 1) {
        progress = 0
        waypointIndex = (waypointIndex + 1) % waypoints.length
      }

      const lat = from.lat + segLat * progress
      const lng = from.lng + segLng * progress
      const heading = computeBearing(from.lat, from.lng, to.lat, to.lng)

      // Vary speed slightly for realism
      const speedVariation = 0.9 + Math.random() * 0.2
      setSimPosition({ lat, lng })
      setSimSpeed(Math.round(SPEED_MPH * speedVariation))
      setSimHeading(heading)

      frameRef.current = setTimeout(tick, TICK_MS)
    }

    // Start immediately
    setSimPosition(waypoints[0])
    setSimHeading(computeBearing(waypoints[0].lat, waypoints[0].lng, waypoints[1].lat, waypoints[1].lng))
    setSimSpeed(SPEED_MPH)
    frameRef.current = setTimeout(tick, TICK_MS)

    return () => {
      if (frameRef.current) clearTimeout(frameRef.current)
    }
  }, [enabled])

  return { simPosition, simSpeed, simHeading }
}

// ── Main hook ───────────────────────────────────────────────────────

export default function useGeolocation() {
  const isDevMode = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('devmode')

  const [position, setPosition] = useState(null)
  const [speed, setSpeed] = useState(0)
  const [heading, setHeading] = useState(null)
  const [error, setError] = useState(null)

  const watchRef = useRef(null)
  const prevPosRef = useRef(null)
  const smoothedRef = useRef(null)
  const compassHeadingRef = useRef(null)

  // Dev mode simulator
  const { simPosition, simSpeed, simHeading } = useDevSimulator(isDevMode)

  // DeviceOrientation compass (priority heading source after GPS heading)
  useEffect(() => {
    if (isDevMode) return

    const handleOrientation = (e) => {
      // webkitCompassHeading (iOS) or alpha (Android)
      let compass = null
      if (e.webkitCompassHeading != null) {
        compass = e.webkitCompassHeading
      } else if (e.alpha != null) {
        compass = (360 - e.alpha) % 360
      }
      if (compass != null) {
        compassHeadingRef.current = compass
      }
    }

    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true)
          }
        })
        .catch(() => {})
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true)
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [isDevMode])

  // GPS watcher
  const handlePosition = useCallback((pos) => {
    const rawLat = pos.coords.latitude
    const rawLng = pos.coords.longitude
    const rawSpeed = pos.coords.speed != null ? Math.round(pos.coords.speed * 2.237) : 0

    // ── Smooth position (simple exponential filter) ──
    let lat, lng
    if (smoothedRef.current) {
      lat = smoothedRef.current.lat * (1 - SMOOTH_FACTOR) + rawLat * SMOOTH_FACTOR
      lng = smoothedRef.current.lng * (1 - SMOOTH_FACTOR) + rawLng * SMOOTH_FACTOR
    } else {
      lat = rawLat
      lng = rawLng
    }
    smoothedRef.current = { lat, lng }

    // ── Determine heading (priority: GPS heading > compass > movement bearing) ──
    let resolvedHeading = null

    // 1. GPS heading (only valid when moving)
    if (pos.coords.heading != null && pos.coords.heading > 0 && rawSpeed > 2) {
      resolvedHeading = pos.coords.heading
    }

    // 2. DeviceOrientation compass
    if (resolvedHeading == null && compassHeadingRef.current != null) {
      resolvedHeading = compassHeadingRef.current
    }

    // 3. Bearing from last two positions (only if moved enough)
    if (resolvedHeading == null && prevPosRef.current) {
      const dist = haversine(prevPosRef.current.lat, prevPosRef.current.lng, lat, lng)
      if (dist > MIN_BEARING_DISTANCE) {
        resolvedHeading = computeBearing(
          prevPosRef.current.lat, prevPosRef.current.lng,
          lat, lng
        )
      }
    }

    // Keep previous heading if we didn't get a new one (avoid snapping to null)
    if (resolvedHeading == null && prevPosRef.current?.heading != null) {
      resolvedHeading = prevPosRef.current.heading
    }

    prevPosRef.current = { lat, lng, heading: resolvedHeading }

    setPosition({ lat, lng })
    setSpeed(rawSpeed)
    setHeading(resolvedHeading)
    setError(null)
  }, [])

  const handleError = useCallback((err) => {
    setError(err.message)
  }, [])

  useEffect(() => {
    if (isDevMode) return // Skip real GPS in dev mode

    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    // Request immediately
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
    })

    // Continuous watch
    watchRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 500,
        timeout: 10000,
      }
    )

    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current)
      }
    }
  }, [isDevMode, handlePosition, handleError])

  // In dev mode, use simulated data
  if (isDevMode) {
    return {
      position: simPosition,
      speed: simSpeed,
      heading: simHeading,
      error: simPosition ? null : 'Dev mode loading...',
    }
  }

  return { position, speed, heading, error }
}
