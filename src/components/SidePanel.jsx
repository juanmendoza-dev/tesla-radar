import { useState } from 'react'
import ReportCard from './ReportCard.jsx'
import SearchBar from './SearchBar.jsx'
import { startOAuthFlow, isAuthenticated, getVehicles, sendNavigation } from '../services/tesla.js'

export default function SidePanel({
  alerts,
  loading,
  onRefresh,
  onSelectDestination,
  destination,
  navigation,
}) {
  const authed = isAuthenticated()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSendToTesla = async () => {
    if (!authed || !destination) return
    setSending(true)
    try {
      const vehicles = await getVehicles()
      if (vehicles.length > 0) {
        await sendNavigation(vehicles[0].id, destination.lat, destination.lng)
        setSent(true)
        setTimeout(() => setSent(false), 3000)
      }
    } catch (err) {
      console.error('Failed to send to Tesla:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="absolute top-0 right-0 bottom-0 z-20 flex flex-col overflow-hidden"
      style={{
        width: '210px',
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Logo + status */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 rounded-full" style={{ border: '1.5px solid #00b4ff', opacity: 0.3 }} />
            <div className="absolute inset-[3px] rounded-full" style={{ border: '1px solid #00b4ff', opacity: 0.5 }} />
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ background: '#00b4ff' }} />
          </div>
          <span
            className="text-xs uppercase"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              letterSpacing: '0.25em',
              color: '#fff',
            }}
          >
            RADAR
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: loading ? '#ff8c00' : '#00ff88',
              animation: 'breathe 2s ease-in-out infinite',
            }}
          />
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}
          >
            {loading ? 'Scanning...' : 'Live'}
          </span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto text-[10px] disabled:opacity-30 transition-opacity touch-manipulation p-1 -m-1"
            style={{ fontFamily: 'var(--font-mono)', color: '#00b4ff' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <SearchBar onSelectPlace={onSelectDestination} />
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.15)' }}
          >
            Nearby — {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {alerts.length === 0 && !loading && (
          <div className="px-4 py-8 text-center">
            <div className="text-2xl mb-2 opacity-10">No alerts</div>
            <div
              className="text-[10px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.15)' }}
            >
              Area clear
            </div>
          </div>
        )}

        {alerts.map((report, i) => (
          <ReportCard key={report.id} report={report} index={i} />
        ))}
      </div>

      {/* Bottom controls */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Send to Tesla / Connect button */}
        {destination && navigation?.active ? (
          <button
            onClick={authed ? handleSendToTesla : startOAuthFlow}
            disabled={sending}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 touch-manipulation transition-all active:scale-[0.97]"
            style={{
              background: sent
                ? 'rgba(0,255,100,0.1)'
                : 'linear-gradient(135deg, rgba(0,180,255,0.15), rgba(0,180,255,0.05))',
              border: `1px solid ${sent ? 'rgba(0,255,100,0.3)' : 'rgba(0,180,255,0.2)'}`,
            }}
          >
            <span
              className="text-[11px] uppercase tracking-wider"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                color: sent ? '#00ff64' : '#00b4ff',
              }}
            >
              {sent ? 'Sent!' : sending ? 'Sending...' : authed ? 'Send to Tesla' : 'Connect Tesla'}
            </span>
          </button>
        ) : (
          <button
            onClick={() => { if (!authed) startOAuthFlow() }}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 touch-manipulation transition-all active:scale-[0.97]"
            style={{
              background: authed
                ? 'linear-gradient(135deg, rgba(0,180,255,0.1), rgba(0,180,255,0.03))'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${authed ? 'rgba(0,180,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <span
              className="text-[11px] uppercase tracking-wider"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                color: authed ? '#00b4ff' : 'rgba(255,255,255,0.3)',
              }}
            >
              {authed ? 'Tesla Connected' : 'Connect Tesla'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
