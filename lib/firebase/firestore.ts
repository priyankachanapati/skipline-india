import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// Type definitions
export type OfficeType = 
  | 'passport'
  | 'aadhaar'
  | 'driving_license'
  | 'ration_card'
  | 'birth_certificate'
  | 'police_station'
  | 'municipal_corporation'
  | 'other';

export type CrowdLevel = 'low' | 'medium' | 'high';

export interface Office {
  id: string;
  name: string;
  type: OfficeType;
  city: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export type ReportSource = 'user' | 'seed' | 'system';

export interface CrowdReport {
  id: string;
  officeId: string;
  crowdLevel: CrowdLevel;
  timestamp: number; // Unix timestamp in milliseconds
  userId?: string;
  source: ReportSource; // Source of the report: 'user' for user submissions, 'seed' for initial data, 'system' for automated
}

/**
 * Fetch all offices in a city
 * PROOF: This function queries Firestore database directly
 */
export const getOfficesByCity = async (city: string): Promise<Office[]> => {
  console.log('[Firebase] Querying Firestore for offices by city:', { city });
  const officesRef = collection(db, 'offices');
  const q = query(officesRef, where('city', '==', city.toLowerCase()));
  const snapshot = await getDocs(q);
  
  console.log('[Firebase] Offices retrieved:', {
    city,
    count: snapshot.docs.length,
  });
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Office[];
};

/**
 * Fetch offices by city and type
 * PROOF: This function queries Firestore database directly
 */
export const getOfficesByCityAndType = async (
  city: string,
  type?: OfficeType
): Promise<Office[]> => {
  console.log('[Firebase] Querying Firestore for offices:', { city, type });
  const officesRef = collection(db, 'offices');
  const constraints: QueryConstraint[] = [where('city', '==', city.toLowerCase())];
  
  if (type) {
    constraints.push(where('type', '==', type));
  }
  
  const q = query(officesRef, ...constraints);
  const snapshot = await getDocs(q);
  
  console.log('[Firebase] Firestore query completed:', {
    city,
    type,
    officesFound: snapshot.docs.length,
    officeIds: snapshot.docs.map(doc => doc.id),
  });
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Office[];
};

/**
 * Get a single office by ID
 * PROOF: This function queries Firestore offices collection
 */
export const getOfficeById = async (officeId: string): Promise<Office | null> => {
  console.log('[Firebase] Querying Firestore for office:', { officeId });
  const officeRef = doc(db, 'offices', officeId);
  const snapshot = await getDoc(officeRef);
  
  if (!snapshot.exists()) {
    console.log('[Firebase] Office not found:', { officeId });
    return null;
  }
  
  const officeData = {
    id: snapshot.id,
    ...snapshot.data(),
  } as Office;
  
  console.log('[Firebase] Office retrieved from Firestore:', {
    officeId,
    name: officeData.name,
    city: officeData.city,
    type: officeData.type,
  });
  
  return officeData;
};

/**
 * Submit a crowd report from user check-in
 * PROOF: This function writes to Firestore crowd_reports collection with source="user"
 */
export const submitCrowdReport = async (
  officeId: string,
  crowdLevel: CrowdLevel,
  userId?: string
): Promise<string> => {
  try {
    // Verify db is initialized
    if (!db) {
      throw new Error('Firestore database not initialized. Check Firebase configuration.');
    }

    // Verify user is authenticated (required by security rules)
    if (typeof window !== 'undefined') {
      const { getCurrentUser } = await import('./auth');
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to submit reports. Please sign in.');
      }
    }

    const timestamp = Date.now();
    const report = {
      officeId,
      crowdLevel,
      timestamp,
      userId: userId || null,
      source: 'user' as ReportSource, // Mark as user-generated report
    };

    console.log('[Firebase] Writing user crowd report to Firestore:', {
      officeId,
      crowdLevel,
      userId: userId || 'anonymous',
      source: 'user',
      timestamp,
      payload: report,
    });

    const reportsRef = collection(db, 'crowd_reports');
    
    // Validate payload before sending
    if (!officeId || !crowdLevel || !timestamp) {
      throw new Error(`Invalid payload: officeId=${officeId}, crowdLevel=${crowdLevel}, timestamp=${timestamp}`);
    }

    if (!['low', 'medium', 'high'].includes(crowdLevel)) {
      throw new Error(`Invalid crowdLevel: ${crowdLevel}. Must be 'low', 'medium', or 'high'.`);
    }

    const docRef = await addDoc(reportsRef, report);
    
    console.log('[Firebase] User crowd report written successfully:', {
      reportId: docRef.id,
      officeId,
      source: 'user',
      timestamp: new Date(timestamp).toISOString(),
    });
    
    return docRef.id;
  } catch (error: any) {
    console.error('[Firebase] Error submitting crowd report:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      officeId,
      crowdLevel,
      userId,
    });
    throw error; // Re-throw to let caller handle it
  }
};

/**
 * Get recent crowd reports for an office within time window (30-60 minutes)
 * Prioritizes user reports over seed/system reports
 * PROOF: This function queries Firestore crowd_reports collection with time filtering
 */
export const getRecentCrowdReports = async (
  officeId: string,
  timeWindowMinutes: number = 60,
  limitCount: number = 100
): Promise<CrowdReport[]> => {
  const now = Date.now();
  const timeWindowMs = timeWindowMinutes * 60 * 1000;
  const cutoffTime = now - timeWindowMs;
  
  console.log('[Firebase] Querying Firestore for crowd reports:', { 
    officeId, 
    timeWindowMinutes,
    cutoffTime: new Date(cutoffTime).toISOString(),
    limitCount 
  });
  
  const reportsRef = collection(db, 'crowd_reports');
  
  // Firestore requires composite index for officeId + timestamp queries
  // Create index at: https://console.firebase.google.com/project/_/firestore/indexes
  // Or deploy firestore.indexes.json using: firebase deploy --only firestore:indexes
  const q = query(
    reportsRef,
    where('officeId', '==', officeId),
    orderBy('timestamp', 'desc'),
    limit(limitCount * 2) // Get more to account for time filtering
  );
  
  const snapshot = await getDocs(q);
  
  // Filter by time window and ensure source field exists (default to 'user' for backward compatibility)
  const allReports = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      // Handle timestamp: could be number or Firestore Timestamp
      let timestamp: number;
      if (typeof data.timestamp === 'number') {
        timestamp = data.timestamp;
      } else if (data.timestamp?.toMillis) {
        timestamp = data.timestamp.toMillis();
      } else {
        console.warn('[Firebase] Invalid timestamp format in report:', { reportId: doc.id, timestamp: data.timestamp });
        timestamp = Date.now(); // Fallback to current time
      }
      
      return {
        id: doc.id,
        officeId: data.officeId,
        crowdLevel: data.crowdLevel,
        timestamp: timestamp, // Ensure timestamp is a number
        userId: data.userId || null,
        source: (data.source || 'user') as 'user' | 'seed' | 'system', // Default to 'user' for old reports
      };
    })
    .filter((r) => {
      // Filter by time window - ensure timestamp is valid number
      const isValid = r.timestamp && typeof r.timestamp === 'number' && r.timestamp >= cutoffTime;
      if (!isValid && r.timestamp) {
        const ageMinutes = (Date.now() - r.timestamp) / 1000 / 60;
        console.warn('[Firebase] Report filtered out due to timestamp:', {
          reportId: r.id,
          timestamp: r.timestamp,
          cutoffTime,
          ageMinutes: ageMinutes.toFixed(2),
          timeWindowMinutes,
        });
      }
      return isValid;
    })
    .slice(0, limitCount) as CrowdReport[];
  
  // Prioritize user reports: put user reports first, then others
  const userReports = allReports.filter(r => r.source === 'user');
  const otherReports = allReports.filter(r => r.source !== 'user');
  const prioritizedReports = [...userReports, ...otherReports];
  
  console.log('[Firebase] Crowd reports retrieved:', {
    officeId,
    totalReports: allReports.length,
    userReports: userReports.length,
    otherReports: otherReports.length,
    timeWindow: `${timeWindowMinutes} minutes`,
    oldestReport: allReports.length > 0 ? new Date(Math.min(...allReports.map(r => r.timestamp))).toISOString() : 'none',
    newestReport: allReports.length > 0 ? new Date(Math.max(...allReports.map(r => r.timestamp))).toISOString() : 'none',
  });
  
  return prioritizedReports;
};
