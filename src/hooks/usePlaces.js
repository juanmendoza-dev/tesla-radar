import { useState, useEffect } from 'react'

export default function usePlaces() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      setLoaded(true)
      return
    }

    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      console.warn('[Tesla Radar] No VITE_GOOGLE_PLACES_API_KEY set')
      return
    }

    // Check if script tag already exists
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          setLoaded(true)
          clearInterval(check)
        }
      }, 100)
      return () => clearInterval(check)
    }

    // Dynamically load Google Maps JS API
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setLoaded(true)
    document.head.appendChild(script)
  }, [])

  return { placesLoaded: loaded }
}
