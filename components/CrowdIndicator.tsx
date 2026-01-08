'use client';

import { CrowdLevel } from '@/lib/firebase/firestore';

interface CrowdIndicatorProps {
  level: CrowdLevel;
  size?: 'sm' | 'md' | 'lg';
}

export default function CrowdIndicator({ level, size = 'md' }: CrowdIndicatorProps) {
  const colorMap = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
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

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold text-white ${colorMap[level]} ${sizeMap[size]}`}
    >
      {textMap[level]} Crowd
    </span>
  );
}
