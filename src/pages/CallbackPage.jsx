import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { handleCallback } from '../services/tesla.js'

export default function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      setError('No authorization code received')
      return
    }

    handleCallback(code, state)
      .then(() => {
        navigate('/', { replace: true })
      })
      .catch((err) => {
        setError(err.message)
      })
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold mb-2">Authentication Failed</h1>
          <p className="text-white/50 text-sm">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 transition-colors"
          >
            Back to Radar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm">Authenticating with Tesla...</p>
      </div>
    </div>
  )
}
