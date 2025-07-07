import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDYHSI8ZYf8umGdBtbfcJJa21IMOvEd2g6k",
  authDomain: "mike-apps-e8e3c.firebaseapp.com",
  projectId: "mike-apps-e8e3c",
  storageBucket: "mike-apps-e8e3c.appspot.com",
  messagingSenderId: "284624238788",
  appId: "1:284624238788:web:0b93853d8db5f8ec3a25d1",
  measurementId: "G-B2477TRE6E9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics }; 