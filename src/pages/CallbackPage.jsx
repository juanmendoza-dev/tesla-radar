import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { handleCallback } from '../services/tesla.js'

export default function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('Authenticating with Tesla...')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')

    // Tesla returned an error
    if (errorParam) {
      setError(`Tesla denied access: ${errorDesc || errorParam}`)
      return
    }

    if (!code) {
      setError('No authorization code received from Tesla')
      return
    }

    setStatus('Exchanging authorization code...')

    handleCallback(code, state)
      .then(() => {
        setStatus('Success! Redirecting...')
        setTimeout(() => navigate('/', { replace: true }), 500)
      })
      .catch((err) => {
        setError(err.message)
      })
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#000' }}>
        <div className="text-center p-8 max-w-md">
          <h1
            className="text-xl mb-3"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#ff4444' }}
          >
            Authentication Failed
          </h1>
          <p
            className="text-sm mb-4"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}
          >
            {error}
          </p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-2 px-6 py-3 rounded-xl text-sm touch-manipulation transition-all active:scale-[0.97]"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              background: 'rgba(0,180,255,0.12)',
              border: '1px solid rgba(0,180,255,0.2)',
              color: '#00b4ff',
            }}
          >
            Back to Radar
          </button>
        </div>
      </div>
    )
  }

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
          style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}
        >
          {status}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
