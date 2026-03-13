import { useEffect, useRef } from 'react';

export default function RadarSweep({ center, radius = 200 }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = radius * 2 + 40; // extra padding for glow

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const rotationSpeed = (Math.PI * 2) / 3000; // full rotation in 3 seconds
    let lastTime = performance.now();

    function draw(now) {
      const dt = now - lastTime;
      lastTime = now;
      angleRef.current += rotationSpeed * dt;

      ctx.clearRect(0, 0, size, size);

      // Draw the sweep beam as a conic-like gradient using arc wedge
      const sweepAngle = Math.PI * 0.4; // width of the beam
      const startAngle = angleRef.current - sweepAngle;
      const endAngle = angleRef.current;

      // Gradient from bright edge to transparent trailing edge
      const steps = 30;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const a1 = startAngle + (sweepAngle * i) / steps;
        const a2 = startAngle + (sweepAngle * (i + 1)) / steps;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, a1, a2);
        ctx.closePath();

        const alpha = t * t * 0.25; // quadratic fade, max 0.25
        ctx.fillStyle = `rgba(0, 180, 255, ${alpha})`;
        ctx.fill();
      }

      // Leading edge bright line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(endAngle) * radius,
        cy + Math.sin(endAngle) * radius
      );
      ctx.strokeStyle = 'rgba(0, 180, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00b4ff';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Subtle center glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.3);
      glow.addColorStop(0, 'rgba(0, 180, 255, 0.12)');
      glow.addColorStop(1, 'rgba(0, 180, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [radius]);

  const size = radius * 2 + 40;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        left: center ? center.x - size / 2 : '50%',
        top: center ? center.y - size / 2 : '50%',
        transform: center ? undefined : 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
