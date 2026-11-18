import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlwKNwgqI7gUGlbTmuGBhVh337oryA2vk",
  authDomain: "project-message-e3514.firebaseapp.com",
  databaseURL: "https://project-message-e3514-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-message-e3514",
  storageBucket: "project-message-e3514.firebasestorage.app",
  messagingSenderId: "374155025014",
  appId: "1:374155025014:web:fd5b0dd53c07a112fe9d57",
  measurementId: "G-WKVJMC2MXH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
export const db = getFirestore(app);
export default app;
