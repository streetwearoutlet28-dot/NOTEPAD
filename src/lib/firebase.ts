import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvZfX9BcLnhqsyZDBhXHqctOQtBlxLQMM",
  authDomain: "notepadbyflo.firebaseapp.com",
  projectId: "notepadbyflo",
  storageBucket: "notepadbyflo.firebasestorage.app",
  messagingSenderId: "72424558324",
  appId: "1:72424558324:web:a6eb1de2956f124c4318a1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper function to avoid breaking db.ts compile checks
export function isFirebaseConfigured(): boolean {
  return true;
}
