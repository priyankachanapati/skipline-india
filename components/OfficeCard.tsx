'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Office } from '@/lib/firebase/firestore';
import CrowdIndicator from './CrowdIndicator';
import { CrowdLevel } from '@/lib/firebase/firestore';

interface OfficeCardProps {
  office: Office;
  crowdLevel?: CrowdLevel;
  waitingTime?: number;
  distance?: number;
  index?: number;
}

export default function OfficeCard({
  office,
  crowdLevel,
  waitingTime,
  distance,
  index = 0,
}: OfficeCardProps) {
  const officeTypeNames: Record<string, string> = {
    passport: 'Passport Office',
    aadhaar: 'Aadhaar Center',
    driving_license: 'RTO Office',
    ration_card: 'Ration Card',
    birth_certificate: 'Birth Certificate',
    police_station: 'Police Station',
    municipal_corporation: 'Municipal Corp',
    other: 'Government Office',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: 'easeOut',
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className="mb-3"
    >
      <Link href={`/office/${office.id}`}>
        <motion.div
          className="glass-card rounded-2xl shadow-soft p-4 cursor-pointer"
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-dark-50 text-lg mb-1">{office.name}</h3>
              <p className="text-sm text-dark-300 mb-2">{officeTypeNames[office.type] || office.type}</p>
              <p className="text-xs text-dark-400">{office.city}</p>
            </div>
            {crowdLevel && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
              >
                <CrowdIndicator level={crowdLevel} size="sm" />
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            {waitingTime !== undefined && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="text-sm text-dark-200"
              >
                <span className="font-medium text-primary-400">⏱️ {waitingTime} min</span> wait
              </motion.div>
            )}
            {distance !== undefined && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="text-sm text-dark-300"
              >
                📍 {distance.toFixed(1)} km away
              </motion.div>
            )}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
