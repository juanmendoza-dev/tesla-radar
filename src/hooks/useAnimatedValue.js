import { useState, useEffect, useRef } from 'react';

/**
 * Smooth number interpolation using requestAnimationFrame.
 * @param {number} target - The target value to animate toward.
 * @param {number} duration - Animation duration in ms (default 500).
 * @returns {number} The current interpolated value.
 */
export default function useAnimatedValue(target, duration = 500) {
  const [current, setCurrent] = useState(target);
  const rafRef = useRef(null);
  const startRef = useRef({ value: target, time: 0 });
  const targetRef = useRef(target);
  const currentRef = useRef(target);

  useEffect(() => {
    // If target hasn't changed, skip
    if (targetRef.current === target) return;

    const from = currentRef.current;
    targetRef.current = target;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;

      currentRef.current = value;
      setCurrent(value);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}
