'use client';

import { motion } from 'framer-motion';
import { CrowdLevel } from '@/lib/firebase/firestore';

interface CrowdIndicatorProps {
  level: CrowdLevel;
  size?: 'sm' | 'md' | 'lg';
}

export default function CrowdIndicator({ level, size = 'md' }: CrowdIndicatorProps) {
  const colorMap = {
    low: {
      bg: 'bg-crowd-low',
      dot: 'bg-teal-300',
    },
    medium: {
      bg: 'bg-crowd-medium',
      dot: 'bg-amber-300',
    },
    high: {
      bg: 'bg-crowd-high',
      dot: 'bg-red-300',
    },
  };

  const textMap = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  const sizeMap = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const colors = colorMap[level];
  const isHigh = level === 'high';
  const isMedium = level === 'medium';
  const isLow = level === 'low';

  return (
    <motion.span
      key={level}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative inline-flex items-center gap-1.5 rounded-full font-semibold text-white ${colors.bg} ${sizeMap[size]} ${isHigh ? 'shadow-lg' : ''}`}
    >
      {/* Animated live status dot */}
      <motion.span
        className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
        animate={
          isHigh
            ? {
                scale: [1, 1.4, 1],
                opacity: [1, 0.6, 1],
              }
            : isMedium
            ? {
                scale: [1, 1.3, 1],
                opacity: [1, 0.65, 1],
              }
            : {
                scale: [1, 1.15, 1],
                opacity: [1, 0.75, 1],
              }
        }
        transition={{
          duration: isHigh ? 1.5 : isMedium ? 1.8 : 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span>{textMap[level]} Crowd</span>
      {/* Subtle glow for high crowd - slow red pulse */}
      {isHigh && (
        <motion.span
          className="absolute inset-0 rounded-full -z-10"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
          }}
        />
      )}
      {/* Soft amber shimmer for medium */}
      {isMedium && (
        <motion.span
          className="absolute inset-0 rounded-full -z-10"
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)',
          }}
        />
      )}
      {/* Calm green breathing for low */}
      {isLow && (
        <motion.span
          className="absolute inset-0 rounded-full -z-10"
          animate={{
            opacity: [0.15, 0.3, 0.15],
            scale: [1, 1.01, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: '0 0 12px rgba(20, 184, 166, 0.25)',
          }}
        />
      )}
    </motion.span>
  );
}
