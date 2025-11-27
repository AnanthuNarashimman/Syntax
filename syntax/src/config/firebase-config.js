
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyAEAyz-uV4I1WXhMpGjxQ8Ah3DL7wUWUfM",
  authDomain: "syntax-477e1.firebaseapp.com",
  projectId: "syntax-477e1",
  messagingSenderId: "358087287280",
  appId: "1:358087287280:web:0fcfd860770b8be33f3d35",
  measurementId: "G-Q1MJZYHK77"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
