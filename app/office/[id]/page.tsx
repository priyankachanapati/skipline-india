'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getOfficeById,
  getRecentCrowdReports,
  submitCrowdReport,
  Office,
  CrowdLevel,
} from '@/lib/firebase/firestore';
import {
  calculateCrowdLevel,
  estimateWaitingTime,
  getLastUpdatedTime,
  formatTimestamp,
  aggregateCrowdData,
  AggregatedCrowdData,
} from '@/lib/services/crowdAggregation';
import { getCurrentUser, signInAnon, signInWithGoogle } from '@/lib/firebase/auth';
import { getOfficesByCity, Office as OfficeType } from '@/lib/firebase/firestore';
import { calculateDistance } from '@/lib/services/maps';
import CrowdIndicator from '@/components/CrowdIndicator';
import LoadingSpinner from '@/components/LoadingSpinner';
import OfficeMap from '@/components/OfficeMap';
import OfficeCard from '@/components/OfficeCard';

export default function OfficeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const officeId = params.id as string;

  const [office, setOffice] = useState<Office | null>(null);
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>('medium');
  const [waitingTime, setWaitingTime] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [reportCount, setReportCount] = useState(0);
  const [userReportCount, setUserReportCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [bestTimeSuggestion, setBestTimeSuggestion] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nearbyOffices, setNearbyOffices] = useState<Office[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Check auth status
  useEffect(() => {
    const user = getCurrentUser();
    setIsAuthenticated(!!user);
  }, []);

  // Load office data
  useEffect(() => {
    const loadOfficeData = async () => {
      if (!officeId) return;

      setLoading(true);
      try {
        const officeData = await getOfficeById(officeId);
        if (!officeData) {
          setError('Office not found');
          setLoading(false);
          return;
        }

        setOffice(officeData);

        // Load crowd reports from last 60 minutes (prioritizes user reports)
        const reports = await getRecentCrowdReports(officeId, 60, 100);
        
        // Aggregate crowd data: computes level, average wait time, report count, last updated
        const aggregated = aggregateCrowdData(reports, 60);
        
        console.log('[Office Detail] Aggregated crowd data:', {
          officeId,
          crowdLevel: aggregated.crowdLevel,
          averageWaitTime: aggregated.averageWaitTime,
          reportCount: aggregated.reportCount,
          userReportCount: aggregated.userReportCount,
          lastUpdated: aggregated.lastUpdated ? new Date(aggregated.lastUpdated).toISOString() : null,
        });

        setCrowdLevel(aggregated.crowdLevel);
        setWaitingTime(aggregated.averageWaitTime);
        setLastUpdated(aggregated.lastUpdated);
        setReportCount(aggregated.reportCount);
        setUserReportCount(aggregated.userReportCount);

        // Load nearby offices from same city
        setLoadingNearby(true);
        try {
          const allCityOffices = await getOfficesByCity(officeData.city);
          // Filter out current office and calculate distances
          const nearbyWithDistance = allCityOffices
            .filter((o) => o.id !== officeData.id)
            .map((o) => ({
              office: o,
              distance: calculateDistance(
                officeData.latitude,
                officeData.longitude,
                o.latitude,
                o.longitude
              ),
            }))
            .filter((item) => item.distance <= 10) // Within 10km
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5); // Top 5 nearby
          
          console.log('[Firebase] Nearby offices found:', {
            currentOffice: officeData.name,
            nearbyCount: nearbyWithDistance.length,
            offices: nearbyWithDistance.map(item => ({ 
              name: item.office.name, 
              distance: item.distance.toFixed(2) + ' km' 
            })),
          });
          
          setNearbyOffices(nearbyWithDistance.map(item => item.office));
        } catch (err) {
          console.error('[Firebase] Error loading nearby offices:', err);
        } finally {
          setLoadingNearby(false);
        }

        // Load AI explanations via API route (server-side Gemini)
        setLoadingAI(true);
        const now = new Date();
        const timeOfDay = now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening';
        const dayOfWeek = now.toLocaleDateString('en-IN', { weekday: 'long' });

        try {
          console.log('[Gemini] Calling Gemini API via route:', {
            officeType: officeData.type,
            crowdLevel: level,
            city: officeData.city,
            timeOfDay,
            dayOfWeek,
          });

          // Call Gemini API via server-side route
          const [explanationRes, suggestionRes] = await Promise.all([
            fetch('/api/gemini/explanation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                officeType: officeData.type,
                crowdLevel: level,
                city: officeData.city,
                timeOfDay,
                dayOfWeek,
              }),
            }),
            fetch('/api/gemini/suggestion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                officeType: officeData.type,
                city: officeData.city,
              }),
            }),
          ]);

          if (explanationRes.ok) {
            const explanationData = await explanationRes.json();
            setAiExplanation(explanationData.explanation);
            console.log('[Gemini] Explanation received from API');
          } else {
            throw new Error('Failed to get explanation');
          }

          if (suggestionRes.ok) {
            const suggestionData = await suggestionRes.json();
            setBestTimeSuggestion(suggestionData.suggestion);
            console.log('[Gemini] Suggestion received from API');
          } else {
            throw new Error('Failed to get suggestion');
          }
        } catch (err) {
          console.error('[Gemini] AI generation error:', err);
          // Set fallback messages
          setAiExplanation(`This ${officeData.type} office in ${officeData.city} is currently ${level === 'high' ? 'very busy' : level === 'medium' ? 'moderately busy' : 'less crowded'}. Government offices in India are typically busier during morning hours and weekdays.`);
          setBestTimeSuggestion(`For ${officeData.type} offices in ${officeData.city}, it's generally best to visit during mid-week (Tuesday-Thursday) in the afternoon hours (2-4 PM) to avoid peak crowds.`);
        } finally {
          setLoadingAI(false);
        }
      } catch (err) {
        setError('Failed to load office data');
        console.error('Error loading office:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOfficeData();
  }, [officeId]);

  // Handle crowd report submission
  const handleSubmitReport = async (level: CrowdLevel) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('[UI] Submitting crowd report:', {
        officeId,
        crowdLevel: level,
        isAuthenticated,
      });

      const user = getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated. Please sign in again.');
      }

      console.log('[UI] User authenticated:', { uid: user.uid, isAnonymous: user.isAnonymous });

      // Submit the report
      const reportId = await submitCrowdReport(officeId, level, user.uid);
      console.log('[UI] Report submitted successfully:', { reportId });

      // Wait a moment for Firestore to process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload crowd data with aggregation
      console.log('[UI] Reloading crowd data after submission...');
      const reports = await getRecentCrowdReports(officeId, 60, 100);
      console.log('[UI] Reports retrieved after submission:', {
        totalReports: reports.length,
        userReports: reports.filter(r => r.source === 'user').length,
      });

      const aggregated = aggregateCrowdData(reports, 60);
      console.log('[UI] Aggregated data after submission:', aggregated);

      setCrowdLevel(aggregated.crowdLevel);
      setWaitingTime(aggregated.averageWaitTime);
      setLastUpdated(aggregated.lastUpdated);
      setReportCount(aggregated.reportCount);
      setUserReportCount(aggregated.userReportCount);

      // Show success message
      alert(`Thank you! Your report has been submitted.\n\nReport Count: ${aggregated.reportCount}\nUser Reports: ${aggregated.userReportCount}`);
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error occurred';
      console.error('[UI] Error submitting report:', {
        error: errorMessage,
        code: err?.code,
        stack: err?.stack,
        officeId,
        level,
      });
      
      // Show detailed error message
      setError(`Failed to submit report: ${errorMessage}. Please check console for details.`);
      
      // Also log to console for debugging
      if (err?.code) {
        console.error('[UI] Firebase error code:', err.code);
        if (err.code === 'permission-denied') {
          setError('Permission denied. Please check Firestore security rules and ensure you are authenticated.');
        } else if (err.code === 'unavailable') {
          setError('Firestore is unavailable. Please check your internet connection.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle login
  const handleLogin = async (method: 'anon' | 'google') => {
    try {
      if (method === 'anon') {
        await signInAnon();
      } else {
        await signInWithGoogle();
      }
      setIsAuthenticated(true);
      setShowLoginModal(false);
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !office) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!office) return null;

  const officeTypeNames: Record<string, string> = {
    passport: 'Passport Office',
    aadhaar: 'Aadhaar Enrollment Center',
    driving_license: 'RTO (Driving License Office)',
    ration_card: 'Ration Card Office',
    birth_certificate: 'Birth Certificate Office',
    police_station: 'Police Station',
    municipal_corporation: 'Municipal Corporation',
    other: 'Government Office',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
      >
        ← Back to Search
      </button>

      {/* Office Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{office.name}</h1>
        <p className="text-lg text-gray-600 mb-4">{officeTypeNames[office.type] || office.type}</p>
        <p className="text-gray-500">📍 {office.city}</p>
        {office.address && <p className="text-sm text-gray-500 mt-1">{office.address}</p>}
      </div>

      {/* Crowd Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Current Status</h2>
          <CrowdIndicator level={crowdLevel} size="lg" />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Waiting Time</p>
            <p className="text-3xl font-bold text-gray-900">{waitingTime} min</p>
            <p className="text-xs text-gray-500 mt-1">Based on {reportCount} report{reportCount !== 1 ? 's' : ''} (last 60 min)</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Last Updated</p>
            <p className="text-lg font-semibold text-gray-900">
              {lastUpdated ? formatTimestamp(lastUpdated) : 'No recent reports'}
            </p>
            {userReportCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {userReportCount} user report{userReportCount !== 1 ? 's' : ''} in last hour
              </p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs text-gray-500">
            📊 Data Source: {userReportCount > 0 ? 'User-reported' : 'Aggregated'} (Firebase Firestore, last 60 minutes)
            {userReportCount > 0 && <span className="ml-1">• User data prioritized</span>}
          </p>
        </div>

        {/* Report Crowd Level */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Report current crowd level:
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSubmitReport('low')}
              disabled={submitting}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Low
            </button>
            <button
              onClick={() => handleSubmitReport('medium')}
              disabled={submitting}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Medium
            </button>
            <button
              onClick={() => handleSubmitReport('high')}
              disabled={submitting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              High
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>

      {/* AI Explanation */}
      {aiExplanation && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              🤖 AI Insight
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Powered by Gemini
            </span>
          </div>
          {loadingAI ? (
            <LoadingSpinner />
          ) : (
            <p className="text-gray-700 leading-relaxed">{aiExplanation}</p>
          )}
        </div>
      )}

      {/* Best Time Suggestion */}
      {bestTimeSuggestion && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
            ⏰ Best Time to Visit
          </h2>
          {loadingAI ? (
            <LoadingSpinner />
          ) : (
            <p className="text-gray-700 leading-relaxed">{bestTimeSuggestion}</p>
          )}
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Location</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Google Maps
          </span>
        </div>
        <OfficeMap office={office} />
      </div>

      {/* Nearby Offices */}
      {nearbyOffices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby Offices</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              📊 From Firebase Firestore
            </span>
          </div>
          {loadingNearby ? (
            <LoadingSpinner />
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Other offices within 10km in {office.city}:
              </p>
              {nearbyOffices.map((nearbyOffice) => {
                const distance = calculateDistance(
                  office.latitude,
                  office.longitude,
                  nearbyOffice.latitude,
                  nearbyOffice.longitude
                );
                return (
                  <div key={nearbyOffice.id} className="mb-3">
                    <OfficeCard
                      office={nearbyOffice}
                      distance={distance}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Sign In Required</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Please sign in to report crowd levels and help others.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleLogin('google')}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Sign in with Google
              </button>
              <button
                onClick={() => handleLogin('anon')}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Continue Anonymously
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
