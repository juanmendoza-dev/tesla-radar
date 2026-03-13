const TYPE_COLORS = {
  police: 'text-red-400',
  speed_trap: 'text-yellow-400',
  hazard: 'text-orange-400',
  accident: 'text-purple-400',
  other: 'text-gray-400',
  unknown: 'text-gray-400',
}

const TYPE_ICONS = {
  police: '🚔',
  speed_trap: '📸',
  hazard: '⚠️',
  accident: '💥',
  other: '❗',
  unknown: '❗',
}

function timeAgo(timestamp) {
  const mins = Math.floor((Date.now() - timestamp) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function SidePanel({ alerts, loading, onRefresh }) {
  return (
    <div className="
      w-[200px] h-full flex-shrink-0
      bg-[#12121a] border-l border-white/5
      flex flex-col overflow-hidden
    ">
      {/* Header */}
      <div className="px-3 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">
            Nearby
          </h2>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="
              text-xs text-blue-400 hover:text-blue-300
              disabled:opacity-50 transition-colors
              p-1 -m-1 touch-manipulation
            "
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
        <div className="text-xs text-white/30 mt-0.5">
          {alerts.length} report{alerts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 && !loading && (
          <div className="px-3 py-6 text-center text-white/20 text-xs">
            No reports nearby
          </div>
        )}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="
              px-3 py-2.5 border-b border-white/5
              hover:bg-white/5 transition-colors
              touch-manipulation cursor-pointer
            "
          >
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">{TYPE_ICONS[alert.type]}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold uppercase ${TYPE_COLORS[alert.type]}`}>
                  {alert.type.replace('_', ' ')}
                </div>
                <div className="text-xs text-white/50 truncate">
                  {alert.description}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-white/70">
                    {alert.distance} mi
                  </span>
                  <span className="text-xs text-white/30">
                    {alert.direction}
                  </span>
                  <span className="text-xs text-white/20 ml-auto">
                    {timeAgo(alert.reportedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="px-3 py-2 border-t border-white/5 bg-[#0e0e16]">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-xs text-white/30">
            {loading ? 'Updating...' : 'Live'}
          </span>
        </div>
      </div>
    </div>
  )
}
