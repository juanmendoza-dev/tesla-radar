import { useCallback } from 'react'

export default function RadiusSlider({ value, onChange, min = 1, max = 15 }) {
  const pct = ((value - min) / (max - min)) * 100

  const handleChange = useCallback((e) => {
    onChange(Number(e.target.value))
  }, [onChange])

  return (
    <div className="w-full px-1">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
        >
          Alert Radius
        </span>
        <span
          className="text-sm tabular-nums"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          {value} mi
        </span>
      </div>
      <div className="relative h-12 flex items-center touch-manipulation">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={handleChange}
          className="radius-slider w-full"
          style={{
            '--pct': `${pct}%`,
          }}
        />
      </div>
      <style>{`
        .radius-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 3px;
          background: linear-gradient(
            to right,
            var(--accent) 0%,
            var(--accent) var(--pct),
            rgba(255,255,255,0.06) var(--pct),
            rgba(255,255,255,0.06) 100%
          );
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .radius-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 10px rgba(0,180,255,0.4);
          cursor: pointer;
          border: 2px solid rgba(0,0,0,0.5);
        }
        .radius-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 10px rgba(0,180,255,0.4);
          cursor: pointer;
          border: 2px solid rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  )
}
