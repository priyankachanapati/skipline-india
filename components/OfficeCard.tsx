'use client';

import Link from 'next/link';
import { Office } from '@/lib/firebase/firestore';
import CrowdIndicator from './CrowdIndicator';
import { CrowdLevel } from '@/lib/firebase/firestore';

interface OfficeCardProps {
  office: Office;
  crowdLevel?: CrowdLevel;
  waitingTime?: number;
  distance?: number;
}

export default function OfficeCard({
  office,
  crowdLevel,
  waitingTime,
  distance,
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
    <Link href={`/office/${office.id}`}>
      <div className="bg-white rounded-lg shadow-md p-4 mb-3 active:scale-98 transition-transform">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{office.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{officeTypeNames[office.type] || office.type}</p>
            <p className="text-xs text-gray-500">{office.city}</p>
          </div>
          {crowdLevel && <CrowdIndicator level={crowdLevel} size="sm" />}
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          {waitingTime !== undefined && (
            <div className="text-sm text-gray-700">
              <span className="font-medium">⏱️ {waitingTime} min</span> wait
            </div>
          )}
          {distance !== undefined && (
            <div className="text-sm text-gray-600">
              📍 {distance.toFixed(1)} km away
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
