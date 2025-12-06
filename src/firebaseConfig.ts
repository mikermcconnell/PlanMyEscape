import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration from environment variables
// See .env.development for local development values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate required configuration in development
if (process.env.NODE_ENV === 'development') {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId'] as const;
  const missing = requiredKeys.filter(key => !firebaseConfig[key]);
  if (missing.length > 0) {
    console.error(`Missing Firebase config: ${missing.join(', ')}. Check your .env.development file.`);
  }
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics may not be supported in all environments (e.g., SSR, some browsers)
let analytics: ReturnType<typeof getAnalytics> | null = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {
  // Analytics not supported, continue without it
});

export { analytics };
