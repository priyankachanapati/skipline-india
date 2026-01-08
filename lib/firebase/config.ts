import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

if (typeof window !== 'undefined') {
  // Initialize Firebase only on client side
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('[Firebase] Firebase app initialized');
    } else {
      app = getApps()[0];
      console.log('[Firebase] Using existing Firebase app');
    }
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[Firebase] Firestore database initialized:', {
      projectId: firebaseConfig.projectId,
      dbInitialized: !!db,
    });
  } catch (error: any) {
    console.error('[Firebase] Error initializing Firebase:', {
      error: error.message,
      code: error.code,
      config: {
        hasApiKey: !!firebaseConfig.apiKey,
        hasProjectId: !!firebaseConfig.projectId,
        hasAuthDomain: !!firebaseConfig.authDomain,
      },
    });
    throw error;
  }
}

export { auth, db };
export default app;
