export default function SpeedOverlay({ speed }) {
  return (
    <div className="
      absolute bottom-4 left-4 z-20
      bg-[#12121a]/90 backdrop-blur-sm
      border border-white/10 rounded-2xl
      px-4 py-3 min-w-[80px]
      text-center select-none
    ">
      <div className="text-3xl font-bold tabular-nums leading-none">
        {speed}
      </div>
      <div className="text-xs text-white/40 mt-1 uppercase tracking-wider">
        mph
      </div>
    </div>
  )
}
