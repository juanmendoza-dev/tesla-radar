import { useRef, useEffect } from 'react';

/**
 * Pure CSS animated user marker.
 * Returns a ref-attached div to be used as a MapLibre marker element.
 */
export default function UserMarker() {
  const elRef = useRef(null);

  return (
    <div
      ref={elRef}
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Pulse ring 1 */}
      <span
        style={{
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: '50%',
          border: '2px solid #00b4ff',
          animation: 'pulse-ring 2s ease-out infinite',
        }}
      />

      {/* Pulse ring 2 — staggered by 1s */}
      <span
        style={{
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: '50%',
          border: '2px solid #00b4ff',
          animation: 'pulse-ring 2s ease-out 1s infinite',
        }}
      />

      {/* Core white dot */}
      <span
        style={{
          position: 'relative',
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 0 6px 2px rgba(0, 180, 255, 0.6)',
          zIndex: 1,
        }}
      />
    </div>
  );
}
