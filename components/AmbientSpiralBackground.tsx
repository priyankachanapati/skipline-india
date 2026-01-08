'use client';

import { useEffect, useState } from 'react';

interface AmbientSpiralBackgroundProps {
  enabled?: boolean;
}

export default function AmbientSpiralBackground({ enabled = true }: AmbientSpiralBackgroundProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference (client-side only)
    if (typeof window === 'undefined') {
      setIsMounted(true);
      return;
    }

    setIsMounted(true);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Don't render if disabled, not mounted, or user prefers reduced motion
  if (!enabled || !isMounted || prefersReducedMotion) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ 
        zIndex: 0,
        willChange: 'transform, opacity',
      }}
      aria-hidden="true"
    >
      {/* Spiral/Vortex layers */}
      <div className="absolute inset-0">
        {/* Primary spiral - large, slow rotation */}
        <div
          className="absolute inset-0"
          data-ambient-spiral
          style={{
            background: `radial-gradient(circle at 30% 40%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
                         radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)`,
            opacity: 0.2,
            animation: 'ambient-spiral-rotate 60s linear infinite',
          }}
        />
        
        {/* Secondary spiral - counter-rotation */}
        <div
          className="absolute inset-0"
          data-ambient-spiral
          style={{
            background: `radial-gradient(circle at 60% 30%, rgba(99, 102, 241, 0.35) 0%, transparent 45%),
                         radial-gradient(circle at 40% 70%, rgba(99, 102, 241, 0.25) 0%, transparent 45%)`,
            opacity: 0.18,
            animation: 'ambient-spiral-rotate-reverse 80s linear infinite',
          }}
        />

        {/* Flowing current effect */}
        <div
          className="absolute inset-0"
          data-ambient-spiral
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, 
                         transparent 0deg, 
                         rgba(99, 102, 241, 0.3) 90deg, 
                         transparent 180deg, 
                         rgba(99, 102, 241, 0.25) 270deg, 
                         transparent 360deg)`,
            opacity: 0.15,
            animation: 'ambient-spiral-rotate 120s linear infinite',
          }}
        />

        {/* Subtle radial pulses */}
        <div
          className="absolute inset-0"
          data-ambient-spiral
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.5) 0%, transparent 70%)`,
            opacity: 0.12,
            animation: 'ambient-spiral-pulse 20s ease-in-out infinite',
          }}
        />
      </div>

    </div>
  );
}