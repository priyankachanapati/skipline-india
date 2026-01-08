'use client';

import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  className?: string;
  height?: string;
}

export default function SkeletonLoader({ className = '', height = 'h-4' }: SkeletonLoaderProps) {
  return (
    <motion.div
      className={`bg-dark-700 rounded ${height} ${className}`}
      animate={{
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl shadow-soft p-4 mb-3"
    >
      <SkeletonLoader height="h-6" className="mb-3 w-3/4" />
      <SkeletonLoader height="h-4" className="mb-2 w-1/2" />
      <SkeletonLoader height="h-3" className="mb-4 w-1/3" />
      <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
        <SkeletonLoader height="h-4" className="w-24" />
        <SkeletonLoader height="h-4" className="w-20" />
      </div>
    </motion.div>
  );
}

export function StatusCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl shadow-soft p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <SkeletonLoader height="h-8" className="w-48" />
        <SkeletonLoader height="h-10" className="w-24 rounded-full" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <SkeletonLoader height="h-24" className="rounded-xl" />
        <SkeletonLoader height="h-24" className="rounded-xl" />
      </div>
    </motion.div>
  );
}