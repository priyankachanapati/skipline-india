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

export interface CrowdReport {
  id: string;
  officeId: string;
  crowdLevel: CrowdLevel;
  timestamp: number; // Unix timestamp in milliseconds
  userId?: string;
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
 * Submit a crowd report
 * PROOF: This function writes to Firestore crowd_reports collection
 */
export const submitCrowdReport = async (
  officeId: string,
  crowdLevel: CrowdLevel,
  userId?: string
): Promise<string> => {
  console.log('[Firebase] Writing crowd report to Firestore:', { officeId, crowdLevel, userId });
  const reportsRef = collection(db, 'crowd_reports');
  const report = {
    officeId,
    crowdLevel,
    timestamp: Date.now(),
    userId: userId || null,
  };
  
  const docRef = await addDoc(reportsRef, report);
  console.log('[Firebase] Crowd report written successfully:', { reportId: docRef.id, officeId });
  return docRef.id;
};

/**
 * Get recent crowd reports for an office
 * PROOF: This function queries Firestore crowd_reports collection
 */
export const getRecentCrowdReports = async (
  officeId: string,
  limitCount: number = 10
): Promise<CrowdReport[]> => {
  console.log('[Firebase] Querying Firestore for crowd reports:', { officeId, limitCount });
  const reportsRef = collection(db, 'crowd_reports');
  const q = query(
    reportsRef,
    where('officeId', '==', officeId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  console.log('[Firebase] Crowd reports retrieved:', {
    officeId,
    reportsFound: snapshot.docs.length,
    timestamps: snapshot.docs.map(doc => ({ id: doc.id, timestamp: doc.data().timestamp })),
  });
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CrowdReport[];
};
