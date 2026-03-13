import { useState, useRef, useEffect, useCallback } from 'react'

export default function SearchBar({ onSelectPlace }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const sessionTokenRef = useRef(null)
  const debounceRef = useRef(null)

  // Create a new session token for billing optimization
  useEffect(() => {
    if (window.google?.maps?.places) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
    }
  }, [])

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2 || !window.google?.maps?.places) {
      setSuggestions([])
      return
    }

    try {
      const service = new window.google.maps.places.AutocompleteService()
      service.getPlacePredictions(
        {
          input,
          sessionToken: sessionTokenRef.current,
          types: ['establishment', 'geocode'],
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 3))
            setSelectedIndex(0)
          } else {
            setSuggestions([])
          }
        }
      )
    } catch {
      setSuggestions([])
    }
  }, [])

  const handleInput = (e) => {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 200)
  }

  const selectSuggestion = useCallback((prediction) => {
    if (!window.google?.maps?.places) return

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location
        onSelectPlace({
          lat: loc.lat(),
          lng: loc.lng(),
          name: prediction.structured_formatting?.main_text || prediction.description,
          address: prediction.description,
        })
        setQuery(prediction.structured_formatting?.main_text || prediction.description)
        setSuggestions([])
        // New session token after selection
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
      }
    })
  }, [onSelectPlace])

  return (
    <div className="relative">
      {/* Search input */}
      <div
        className="flex items-center gap-2 px-3 rounded-xl"
        style={{
          height: '48px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={handleInput}
          placeholder="Search destination"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.8)',
            caretColor: '#00b4ff',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]) }}
            className="text-xs p-1 touch-manipulation"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            X
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{
            background: 'rgba(0,0,0,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.place_id}
              onClick={() => selectSuggestion(s)}
              className="w-full text-left px-3 flex items-center gap-3 touch-manipulation transition-colors"
              style={{
                height: '52px',
                background: i === selectedIndex ? 'rgba(0,180,255,0.08)' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={i === selectedIndex ? '#00b4ff' : 'rgba(255,255,255,0.2)'} strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <div className="min-w-0 flex-1">
                <div
                  className="text-sm truncate"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: i === selectedIndex ? '#00b4ff' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {s.structured_formatting?.main_text || s.description}
                </div>
                <div
                  className="text-[10px] truncate mt-0.5"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(255,255,255,0.25)',
                  }}
                >
                  {s.structured_formatting?.secondary_text || ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
