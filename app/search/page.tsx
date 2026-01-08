'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOfficesByCityAndType, Office, OfficeType } from '@/lib/firebase/firestore';
import { getRecentCrowdReports } from '@/lib/firebase/firestore';
import { calculateCrowdLevel, estimateWaitingTime, aggregateCrowdData } from '@/lib/services/crowdAggregation';
import OfficeCard from '@/components/OfficeCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CardSkeleton } from '@/components/SkeletonLoader';
import { getCurrentLocation, findNearbyOffices } from '@/lib/services/maps';

// Major Indian cities
const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Surat',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Patna',
  'Vadodara',
  'Ghaziabad',
];

const OFFICE_TYPES: { value: OfficeType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'passport', label: 'Passport Office' },
  { value: 'aadhaar', label: 'Aadhaar Center' },
  { value: 'driving_license', label: 'RTO Office' },
  { value: 'ration_card', label: 'Ration Card' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'police_station', label: 'Police Station' },
  { value: 'municipal_corporation', label: 'Municipal Corp' },
  { value: 'other', label: 'Other' },
];

export default function SearchPage() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState<OfficeType | ''>('');
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [officeData, setOfficeData] = useState<
    Record<string, { crowdLevel: string; waitingTime: number; distance?: number }>
  >({});
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Load offices when city or type changes
  useEffect(() => {
    if (!selectedCity) {
      setOffices([]);
      return;
    }

    const loadOffices = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getOfficesByCityAndType(
          selectedCity,
          selectedType || undefined
        );
        setOffices(data);

        // Load crowd data for each office (aggregated from last 60 minutes)
        const crowdData: Record<string, { crowdLevel: string; waitingTime: number }> = {};
        for (const office of data) {
          try {
            const reports = await getRecentCrowdReports(office.id, 60, 100);
            const aggregated = aggregateCrowdData(reports, 60);
            crowdData[office.id] = { 
              crowdLevel: aggregated.crowdLevel, 
              waitingTime: aggregated.averageWaitTime 
            };
          } catch (err) {
            console.error(`Error loading crowd data for ${office.id}:`, err);
          }
        }
        setOfficeData(crowdData);
      } catch (err) {
        setError('Failed to load offices. Please try again.');
        console.error('Error loading offices:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOffices();
  }, [selectedCity, selectedType]);

  // Handle location-based search
  const handleUseLocation = async () => {
    try {
      console.log('[Location] Requesting user location...');
      setError('');
      
      // Get user's current location
      const position = await getCurrentLocation();
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      console.log('[Location] Location obtained:', { lat, lon });
      setUserLocation({ lat, lon });
      setUseLocation(true);
      setLoading(true);

      // If no city selected or no offices loaded, load all offices first
      let officesToFilter = offices;
      if (offices.length === 0) {
        console.log('[Location] No offices loaded, fetching all offices...');
        // Load offices from all major cities
        const allOffices: Office[] = [];
        for (const city of INDIAN_CITIES.slice(0, 5)) { // Limit to first 5 cities for performance
          try {
            const cityOffices = await getOfficesByCityAndType(city.toLowerCase(), undefined);
            allOffices.push(...cityOffices);
          } catch (err) {
            console.error(`Error loading offices for ${city}:`, err);
          }
        }
        officesToFilter = allOffices;
        console.log('[Location] Loaded offices for filtering:', allOffices.length);
      }

      // Filter offices by distance
      const nearby = findNearbyOffices<Office>(lat, lon, officesToFilter, 10);
      console.log('[Location] Nearby offices found:', nearby.length);
      
      const updatedData: Record<string, { crowdLevel: string; waitingTime: number; distance: number }> = {};
      
      // Load crowd data for nearby offices (aggregated from last 60 minutes)
      for (const officeWithDistance of nearby) {
        try {
          const reports = await getRecentCrowdReports(officeWithDistance.id, 60, 100);
          const aggregated = aggregateCrowdData(reports, 60);
          updatedData[officeWithDistance.id] = { 
            crowdLevel: aggregated.crowdLevel, 
            waitingTime: aggregated.averageWaitTime, 
            distance: officeWithDistance.distance 
          };
        } catch (err) {
          console.error(`Error loading crowd data for ${officeWithDistance.id}:`, err);
          updatedData[officeWithDistance.id] = { 
            crowdLevel: 'medium', 
            waitingTime: 30, 
            distance: officeWithDistance.distance 
          };
        }
      }

      setOfficeData(updatedData);
      setOffices(nearby.map(({ distance, ...office }) => office as Office));
      setSelectedCity(''); // Clear city filter since we're showing nearby offices
      setLoading(false);
      
      if (nearby.length === 0) {
        setError('No offices found within 10km of your location.');
      }
    } catch (err: any) {
      console.error('[Location] Error:', err);
      setError(`Could not get your location: ${err.message || 'Please enable location access in your browser settings.'}`);
      setLoading(false);
    }
  };

  // Sort offices by distance if location is used
  const sortedOffices = useLocation && userLocation
    ? [...offices].sort((a, b) => {
        const distA = officeData[a.id]?.distance || Infinity;
        const distB = officeData[b.id]?.distance || Infinity;
        return distA - distB;
      })
    : offices;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-4xl mx-auto"
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-3xl font-bold text-dark-50 mb-6"
      >
        Find Government Offices
      </motion.h1>

      {/* Search Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="glass-card rounded-2xl shadow-soft p-4 mb-6"
      >
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Select City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2.5 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 text-dark-200 bg-dark-800/50 transition-all appearance-none cursor-pointer select-dark"
            >
              <option value="" className="bg-dark-800 text-dark-200">Choose a city...</option>
              {INDIAN_CITIES.map((city) => (
                <option key={city} value={city} className="bg-dark-800 text-dark-200">
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Office Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as OfficeType | '')}
              className="w-full px-4 py-2.5 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 text-dark-200 bg-dark-800/50 transition-all disabled:opacity-50 appearance-none cursor-pointer select-dark"
              disabled={!selectedCity}
            >
              {OFFICE_TYPES.map((type) => (
                <option key={type.value} value={type.value} className="bg-dark-800 text-dark-200">
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <motion.button
          onClick={handleUseLocation}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full md:w-auto px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-400 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
        >
          {loading ? '📍 Finding location...' : '📍 Find Offices Near Me'}
        </motion.button>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-crowd-high/20 border border-crowd-high/30 text-crowd-high px-4 py-3 rounded-xl mb-6 backdrop-blur-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {!loading && selectedCity && sortedOffices.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card rounded-2xl shadow-soft p-8 text-center"
          >
            <p className="text-dark-300">
              No offices found in {selectedCity}. Be the first to add one!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Office List */}
      {!loading && sortedOffices.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold text-dark-50">
              {sortedOffices.length} Office{sortedOffices.length > 1 ? 's' : ''} Found
            </h2>
            <span className="text-xs text-dark-400 bg-dark-800 px-2 py-1 rounded-lg border border-white/10">
              📊 Data from Firebase Firestore
            </span>
          </motion.div>
          {sortedOffices.map((office, index) => (
            <OfficeCard
              key={office.id}
              office={office}
              crowdLevel={officeData[office.id]?.crowdLevel as any}
              waitingTime={officeData[office.id]?.waitingTime}
              distance={officeData[office.id]?.distance}
              index={index}
            />
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      <AnimatePresence>
        {!selectedCity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card rounded-2xl shadow-soft p-8 text-center"
          >
            <p className="text-dark-300 mb-4">
              Select a city to start searching for government offices
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
