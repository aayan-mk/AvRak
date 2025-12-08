import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAAeoI_KiWYoUZ5-eZhOoSWZmH4oP-8wcQ",
  authDomain: "avrak-9fc3f.firebaseapp.com",
  projectId: "avrak-9fc3f",
  storageBucket: "avrak-9fc3f.firebasestorage.app",
  messagingSenderId: "764185158160",
  appId: "1:764185158160:android:a411a7fbfcd951fbb36095",
};

// INIT APP (safe)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ✅ FIX: Enable persistence manually for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
