import { useState, useCallback, useEffect, useRef } from 'react'
import { fetchRoute, calculateETA, isOffRoute } from '../services/routing.js'

export default function useNavigation(position) {
  const [route, setRoute] = useState(null)
  const [navigation, setNavigation] = useState({
    active: false,
    nextManeuver: null,
    nextDistance: null,
    nextStreet: null,
    eta: null,
    arrivalTime: null,
    currentStepIndex: 0,
  })
  const [destination, setDestination] = useState(null)
  const routeRef = useRef(null)

  const startNavigation = useCallback(async (dest) => {
    if (!position) return
    setDestination(dest)

    try {
      const routeData = await fetchRoute(
        position.lat, position.lng,
        dest.lat, dest.lng
      )

      routeRef.current = routeData
      setRoute(routeData)

      const { minutes, arrivalTime } = calculateETA(routeData.duration)
      const firstTurn = routeData.turns[1] || routeData.turns[0]

      setNavigation({
        active: true,
        nextManeuver: firstTurn?.maneuver || 'straight',
        nextDistance: firstTurn?.distance || '',
        nextStreet: firstTurn?.street || '',
        eta: minutes,
        arrivalTime,
        currentStepIndex: 0,
      })
    } catch (err) {
      console.error('Failed to fetch route:', err)
    }
  }, [position])

  const stopNavigation = useCallback(() => {
    setRoute(null)
    setDestination(null)
    routeRef.current = null
    setNavigation({
      active: false,
      nextManeuver: null,
      nextDistance: null,
      nextStreet: null,
      eta: null,
      arrivalTime: null,
      currentStepIndex: 0,
    })
  }, [])

  // Update navigation state as position changes
  useEffect(() => {
    if (!navigation.active || !position || !routeRef.current) return

    const routeData = routeRef.current

    // Check if off route
    if (isOffRoute(position, routeData.geometry)) {
      // Recalculate route
      if (destination) {
        startNavigation(destination)
      }
      return
    }

    // Update ETA based on remaining distance
    // Find closest step by checking which turn we've passed
    const turns = routeData.turns
    let currentIndex = navigation.currentStepIndex

    // Advance step if we're close to the next turn
    if (currentIndex < turns.length - 1) {
      const nextTurn = turns[currentIndex + 1]
      if (nextTurn) {
        // Estimate remaining distance for current step
        const remainingDuration = turns
          .slice(currentIndex)
          .reduce((sum, t) => sum + (t.duration || 0), 0)

        const { minutes, arrivalTime } = calculateETA(remainingDuration)

        setNavigation((prev) => ({
          ...prev,
          nextManeuver: turns[currentIndex + 1]?.maneuver || 'straight',
          nextDistance: turns[currentIndex + 1]?.distance || '',
          nextStreet: turns[currentIndex + 1]?.street || '',
          eta: minutes,
          arrivalTime,
        }))
      }
    }
  }, [position, navigation.active, navigation.currentStepIndex, destination, startNavigation])

  return {
    route,
    navigation,
    destination,
    startNavigation,
    stopNavigation,
  }
}
