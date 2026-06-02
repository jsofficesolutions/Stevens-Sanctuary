import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBzarUX4dkMs487-doUfG1Ct8oivtoLX9Y",
  authDomain: "stevens-sanctuary.firebaseapp.com",
  projectId: "stevens-sanctuary",
  storageBucket: "stevens-sanctuary.firebasestorage.app",
  messagingSenderId: "45718875766",
  appId: "1:45718875766:web:f06156090035d44366b957"
};

// Add the 'export' keyword before each initialization
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = typeof __app_id !== 'undefined' ? __app_id : "stevens-sanctuary";
