import { useState, useEffect, useRef } from "react";

// Animates a number from 0 up to `end` over `duration` ms
export function useCountUp(end, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const startTime = useRef(null);
  const rafId = useRef(null);

  useEffect(() => {
    startTime.current = null;

    const animate = (timestamp) => {
      if (startTime.current === null) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutExpo — fast start, smooth settle
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(end * eased);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        setValue(end);
      }
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [end, duration]);

  return Number(value.toFixed(decimals));
}