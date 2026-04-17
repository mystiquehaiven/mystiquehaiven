// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVHVutgjOCQDJdISlXaA_vsKF-Cs61ZNc",
  authDomain: "mystiquehaiven.firebaseapp.com",
  projectId: "mystiquehaiven",
  storageBucket: "mystiquehaiven.firebasestorage.app",
  messagingSenderId: "112268185032",
  appId: "1:112268185032:web:c8b646d44a4e4cab8bc4fd",
  measurementId: "G-SQFHQN5K8Q"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);