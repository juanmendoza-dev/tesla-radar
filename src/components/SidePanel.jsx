import ReportCard from './ReportCard.jsx'
import RadiusSlider from './RadiusSlider.jsx'
import { startOAuthFlow, isAuthenticated } from '../services/tesla.js'

export default function SidePanel({
  alerts,
  loading,
  onRefresh,
  radius,
  onRadiusChange,
}) {
  const authed = isAuthenticated()

  return (
    <div
      className="absolute top-0 right-0 bottom-0 w-[200px] z-20 flex flex-col overflow-hidden"
      style={{
        background: 'var(--panel-bg)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Logo / Brand */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-2">
          {/* Radar icon */}
          <div className="relative w-5 h-5">
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: '1.5px solid var(--accent)', opacity: 0.3 }}
            />
            <div
              className="absolute inset-[3px] rounded-full"
              style={{ border: '1px solid var(--accent)', opacity: 0.5 }}
            />
            <div
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ background: 'var(--accent)' }}
            />
          </div>
          <span
            className="text-xs uppercase"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              letterSpacing: '0.25em',
              color: 'var(--text-primary)',
            }}
          >
            RADAR
          </span>
        </div>

        {/* Live status */}
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
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
          >
            {loading ? 'Scanning...' : 'Live'}
          </span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto text-[10px] disabled:opacity-30 transition-opacity touch-manipulation p-1 -m-1"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent)',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Reports list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}
          >
            Nearby — {alerts.length} report{alerts.length !== 1 ? 's' : ''}
          </span>
        </div>
        {alerts.length === 0 && !loading && (
          <div className="px-4 py-8 text-center">
            <div className="text-2xl mb-2 opacity-20">📡</div>
            <div
              className="text-[10px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}
            >
              No reports in range
            </div>
          </div>
        )}
        {alerts.slice(0, 4).map((report, i) => (
          <ReportCard key={report.id} report={report} index={i} />
        ))}
      </div>

      {/* Controls */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--card-border)' }}>
        <RadiusSlider value={radius} onChange={onRadiusChange} />

        {/* Navigate button */}
        <button
          onClick={() => {
            if (!authed) startOAuthFlow()
          }}
          className="w-full mt-3 h-12 rounded-xl flex items-center justify-center gap-2 touch-manipulation transition-all active:scale-[0.97]"
          style={{
            background: authed
              ? 'linear-gradient(135deg, rgba(0,180,255,0.15), rgba(0,180,255,0.05))'
              : 'var(--card-bg)',
            border: `1px solid ${authed ? 'rgba(0,180,255,0.2)' : 'var(--card-border)'}`,
          }}
        >
          <span className="text-sm">🧭</span>
          <span
            className="text-[11px] uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              color: authed ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            {authed ? 'Navigate' : 'Connect Tesla'}
          </span>
        </button>
      </div>
    </div>
  )
}
