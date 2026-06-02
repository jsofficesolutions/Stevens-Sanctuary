const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBzarUX4dkMs487-doUfG1Ct8oivtoLX9Y",
  authDomain: "stevens-sanctuary.firebaseapp.com",
  projectId: "stevens-sanctuary",
  storageBucket: "stevens-sanctuary.firebasestorage.app",
  messagingSenderId: "45718875766",
  appId: "1:45718875766:web:f06156090035d44366b957"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : "stevens-sanctuary";
