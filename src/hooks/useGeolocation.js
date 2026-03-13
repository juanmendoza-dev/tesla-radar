import { useState, useEffect, useRef, useCallback } from 'react'

export default function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [speed, setSpeed] = useState(0)
  const [heading, setHeading] = useState(null)
  const [error, setError] = useState(null)
  const watchRef = useRef(null)

  const handlePosition = useCallback((pos) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    })
    setSpeed(pos.coords.speed != null ? Math.round(pos.coords.speed * 2.237) : 0) // m/s to mph
    setHeading(pos.coords.heading != null && pos.coords.heading > 0 ? pos.coords.heading : null)
    setError(null)
  }, [])

  const handleError = useCallback((err) => {
    setError(err.message)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
    })

    // Watch position continuously
    watchRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    )

    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current)
      }
    }
  }, [handlePosition, handleError])

  return { position, speed, heading, error }
}
