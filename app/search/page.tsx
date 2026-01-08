'use client';

import { useState, useEffect } from 'react';
import { getOfficesByCityAndType, Office, OfficeType } from '@/lib/firebase/firestore';
import { getRecentCrowdReports } from '@/lib/firebase/firestore';
import { calculateCrowdLevel, estimateWaitingTime, aggregateCrowdData } from '@/lib/services/crowdAggregation';
import OfficeCard from '@/components/OfficeCard';
import LoadingSpinner from '@/components/LoadingSpinner';
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
      const nearby = findNearbyOffices(lat, lon, officesToFilter, 10);
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
      setOffices(nearby.map(({ distance, ...office }) => office));
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Government Offices</h1>

      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Choose a city...</option>
              {INDIAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as OfficeType | '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!selectedCity}
            >
              {OFFICE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleUseLocation}
          disabled={loading}
          className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '📍 Finding location...' : '📍 Find Offices Near Me'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Results */}
      {!loading && selectedCity && sortedOffices.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">
            No offices found in {selectedCity}. Be the first to add one!
          </p>
        </div>
      )}

      {/* Office List */}
      {!loading && sortedOffices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {sortedOffices.length} Office{sortedOffices.length > 1 ? 's' : ''} Found
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              📊 Data from Firebase Firestore
            </span>
          </div>
          {sortedOffices.map((office) => (
            <OfficeCard
              key={office.id}
              office={office}
              crowdLevel={officeData[office.id]?.crowdLevel as any}
              waitingTime={officeData[office.id]?.waitingTime}
              distance={officeData[office.id]?.distance}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!selectedCity && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">
            Select a city to start searching for government offices
          </p>
        </div>
      )}
    </div>
  );
}
