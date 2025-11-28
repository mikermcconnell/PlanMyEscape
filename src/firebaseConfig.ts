import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCC7Z05xhoWleAQCSUSm0RCMU3bfeeXNgE",
  authDomain: "planmyescape-b38b8.firebaseapp.com",
  projectId: "planmyescape-b38b8",
  storageBucket: "planmyescape-b38b8.firebasestorage.app",
  messagingSenderId: "650087453484",
  appId: "1:650087453484:web:fb62304a877203b2f6d289",
  measurementId: "G-0FDEETZ1S3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
