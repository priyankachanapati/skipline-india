'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
} from '@/lib/services/crowdAggregation';
import { getCurrentUser, signInAnon, signInWithGoogle } from '@/lib/firebase/auth';
import { getOfficesByCity, Office as OfficeType } from '@/lib/firebase/firestore';
import { calculateDistance } from '@/lib/services/maps';
import CrowdIndicator from '@/components/CrowdIndicator';
import LoadingSpinner from '@/components/LoadingSpinner';
import OfficeMap from '@/components/OfficeMap';
import OfficeCard from '@/components/OfficeCard';
import { StatusCardSkeleton } from '@/components/SkeletonLoader';

export default function OfficeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const officeId = params.id as string;

  const [office, setOffice] = useState<Office | null>(null);
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>('medium');
  const [waitingTime, setWaitingTime] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
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
  const [selectedCrowdLevel, setSelectedCrowdLevel] = useState<CrowdLevel | null>(null);
  const [reportFeedback, setReportFeedback] = useState('');
  const [animatedWaitTime, setAnimatedWaitTime] = useState(0);

  // Animate wait time count-up
  useEffect(() => {
    if (waitingTime > 0) {
      setAnimatedWaitTime(0);
      const duration = 1000; // 1 second
      const steps = 30;
      const increment = waitingTime / steps;
      const stepDuration = duration / steps;
      
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= waitingTime) {
          setAnimatedWaitTime(waitingTime);
          clearInterval(timer);
        } else {
          setAnimatedWaitTime(Math.floor(current));
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [waitingTime]);

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

        // Load crowd reports
        const reports = await getRecentCrowdReports(officeId, 10);
        const level = calculateCrowdLevel(reports);
        const time = estimateWaitingTime(level);
        const updated = getLastUpdatedTime(reports);

        setCrowdLevel(level);
        setWaitingTime(time);
        setLastUpdated(updated);

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
    setSelectedCrowdLevel(level);
    setReportFeedback('');

    try {
      const user = getCurrentUser();
      await submitCrowdReport(officeId, level, user?.uid);

      // Reload crowd data
      const reports = await getRecentCrowdReports(officeId, 10);
      const newLevel = calculateCrowdLevel(reports);
      const newTime = estimateWaitingTime(newLevel);
      const updated = getLastUpdatedTime(reports);

      setCrowdLevel(newLevel);
      setWaitingTime(newTime);
      setLastUpdated(updated);
      setReportFeedback('Thanks for updating!');

      // Clear feedback after 3 seconds
      setTimeout(() => {
        setReportFeedback('');
        setSelectedCrowdLevel(null);
      }, 3000);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
      setSelectedCrowdLevel(null);
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <StatusCardSkeleton />
      </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-4xl mx-auto"
    >
      {/* Back Button */}
      <motion.button
        onClick={() => router.back()}
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        className="mb-4 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
      >
        ← Back to Search
      </motion.button>

      {/* Office Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="glass-card rounded-2xl shadow-soft p-6 mb-6"
      >
        <h1 className="text-3xl font-bold text-dark-50 mb-2">{office.name}</h1>
        <p className="text-lg text-dark-300 mb-4">{officeTypeNames[office.type] || office.type}</p>
        <p className="text-dark-400">📍 {office.city}</p>
        {office.address && <p className="text-sm text-dark-400 mt-1">{office.address}</p>}
      </motion.div>

      {/* Crowd Status Card */}
      <motion.div
        key={crowdLevel}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="glass-card rounded-2xl shadow-soft p-6 mb-6 hover:shadow-soft-lg transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-dark-50">Current Status</h2>
          <CrowdIndicator level={crowdLevel} size="lg" />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 rounded-xl p-4 border border-white/5 hover:border-primary-500/20 transition-all"
          >
            <p className="text-sm text-dark-400 mb-1">Estimated Waiting Time</p>
            <motion.p
              key={waitingTime}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-3xl font-bold text-primary-400"
            >
              {animatedWaitTime || waitingTime} min
            </motion.p>
            {/* Confidence/Progress bar */}
            <motion.div
              className="mt-3 h-1 bg-dark-700 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="h-full bg-primary-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((waitingTime / 60) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
              />
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 rounded-xl p-4 border border-white/5 hover:border-primary-500/20 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-dark-400">Last Updated</p>
              {lastUpdated && (
                <motion.span
                  className="w-2 h-2 rounded-full bg-primary-400"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </div>
            <p className="text-lg font-semibold text-dark-200">
              {lastUpdated ? formatTimestamp(lastUpdated) : 'No recent reports'}
            </p>
          </motion.div>
        </div>
        <div className="mb-4">
          <p className="text-xs text-dark-400">
            📊 Data Source: User-reported (Firebase Firestore)
          </p>
        </div>

        {/* Report Crowd Level */}
        <div className="border-t border-white/10 pt-4">
          <p className="text-sm font-medium text-dark-300 mb-3">
            Report current crowd level:
          </p>
          <div className="flex gap-2 flex-wrap">
            <motion.button
              onClick={() => handleSubmitReport('low')}
              disabled={submitting}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(20, 184, 166, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 bg-crowd-low text-white rounded-xl transition-all disabled:opacity-50 text-sm font-medium shadow-soft ${
                selectedCrowdLevel === 'low' ? 'ring-2 ring-teal-300 ring-offset-2 ring-offset-dark-900' : ''
              }`}
            >
              {selectedCrowdLevel === 'low' && submitting ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Submitting...
                </span>
              ) : (
                'Low'
              )}
            </motion.button>
            <motion.button
              onClick={() => handleSubmitReport('medium')}
              disabled={submitting}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 bg-crowd-medium text-white rounded-xl transition-all disabled:opacity-50 text-sm font-medium shadow-soft ${
                selectedCrowdLevel === 'medium' ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-dark-900' : ''
              }`}
            >
              {selectedCrowdLevel === 'medium' && submitting ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Submitting...
                </span>
              ) : (
                'Medium'
              )}
            </motion.button>
            <motion.button
              onClick={() => handleSubmitReport('high')}
              disabled={submitting}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 bg-crowd-high text-white rounded-xl transition-all disabled:opacity-50 text-sm font-medium shadow-soft ${
                selectedCrowdLevel === 'high' ? 'ring-2 ring-red-300 ring-offset-2 ring-offset-dark-900' : ''
              }`}
            >
              {selectedCrowdLevel === 'high' && submitting ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Submitting...
                </span>
              ) : (
                'High'
              )}
            </motion.button>
          </div>
          <AnimatePresence mode="wait">
            {reportFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="flex items-center gap-2 mt-2 text-primary-400 text-sm"
              >
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </motion.svg>
                {reportFeedback}
              </motion.div>
            )}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-crowd-high text-sm mt-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* AI Explanation */}
      <AnimatePresence>
        {aiExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="glass-card rounded-2xl shadow-soft p-6 mb-6 hover:shadow-soft-lg transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-dark-50 flex items-center">
                🤖 AI Insight
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400 bg-dark-800 px-2 py-1 rounded-lg border border-white/10">
                  Powered by Gemini
                </span>
                <span className="text-xs text-dark-500 bg-dark-800/50 px-2 py-1 rounded-lg border border-white/5">
                  Insight confidence: Medium
                </span>
              </div>
            </div>
            {loadingAI ? (
              <LoadingSpinner />
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-dark-200 leading-relaxed"
              >
                {aiExplanation.split(/(moderately busy|morning hours|afternoon|evening|peak|low crowd|high crowd|best time|avoid)/gi).map((part, index) => {
                  const isHighlight = /moderately busy|morning hours|afternoon|evening|peak|low crowd|high crowd|best time|avoid/i.test(part);
                  return isHighlight ? (
                    <motion.span
                      key={index}
                      initial={{ backgroundColor: 'transparent' }}
                      animate={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                      className="px-1 rounded font-medium text-primary-300"
                    >
                      {part}
                    </motion.span>
                  ) : (
                    <span key={index}>{part}</span>
                  );
                })}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Best Time Suggestion */}
      <AnimatePresence>
        {bestTimeSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="glass-card rounded-2xl shadow-soft p-6 mb-6 hover:shadow-soft-lg transition-all"
          >
            <h2 className="text-xl font-bold text-dark-50 mb-3 flex items-center">
              ⏰ Best Time to Visit
            </h2>
            {loadingAI ? (
              <LoadingSpinner />
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-dark-200 leading-relaxed"
              >
                {bestTimeSuggestion || 'Unable to generate time suggestion at this time.'}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="glass-card rounded-2xl shadow-soft p-6 mb-6 hover:shadow-soft-lg transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark-50">Location</h2>
          <span className="text-xs text-dark-400 bg-dark-800 px-2 py-1 rounded-lg border border-white/10">
            Google Maps
          </span>
        </div>
        <div className="rounded-xl overflow-hidden">
          <OfficeMap office={office} />
        </div>
      </motion.div>

      {/* Nearby Offices */}
      <AnimatePresence>
        {nearbyOffices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="glass-card rounded-2xl shadow-soft p-6 mb-6 hover:shadow-soft-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-dark-50">Nearby Offices</h2>
              <span className="text-xs text-dark-400 bg-dark-800 px-2 py-1 rounded-lg border border-white/10">
                📊 From Firebase Firestore
              </span>
            </div>
            {loadingNearby ? (
              <LoadingSpinner />
            ) : (
              <div>
                <p className="text-sm text-dark-300 mb-4">
                  Other offices within 10km in {office.city}:
                </p>
                {nearbyOffices.map((nearbyOffice, index) => {
                  const distance = calculateDistance(
                    office.latitude,
                    office.longitude,
                    nearbyOffice.latitude,
                    nearbyOffice.longitude
                  );
                  return (
                    <OfficeCard
                      key={nearbyOffice.id}
                      office={nearbyOffice}
                      distance={distance}
                      index={index}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="glass-card rounded-2xl shadow-soft-lg p-6 max-w-sm w-full border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-dark-50 mb-4">Sign In Required</h3>
              <p className="text-dark-300 mb-4 text-sm">
                Please sign in to report crowd levels and help others.
              </p>
              <div className="space-y-3">
                <motion.button
                  onClick={() => handleLogin('google')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 glass border border-white/20 rounded-xl hover:bg-white/5 transition-all font-medium text-dark-200"
                >
                  Sign in with Google
                </motion.button>
                <motion.button
                  onClick={() => handleLogin('anon')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-400 transition-all font-medium shadow-soft"
                >
                  Continue Anonymously
                </motion.button>
                <motion.button
                  onClick={() => setShowLoginModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 text-dark-400 hover:text-dark-300 text-sm transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
