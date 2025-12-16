// ------------------------------------------------------------
//  AVRAK EMERGENCY ALERT HANDLER (FINAL)
//  ✔ Saves accident
//  ✔ Calls emergency contact
//  ✔ Notifies nearby users (1.5 km)
//  ✔ Returns clear status for UI
// ------------------------------------------------------------

import { Platform, NativeModules, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db } from "../services/firebaseConfig";
import {
  collection,
  addDoc,
  GeoPoint,
  serverTimestamp,
  getDocs
} from "firebase/firestore";

// Optional TTS
let Tts;
try { Tts = require("react-native-tts"); } catch { Tts = null; }

const { DirectCall } = NativeModules || {};

// ------------------------------------------------------------
// 🔊 SPEAK (OPTIONAL)
// ------------------------------------------------------------
function speak(text) {
  try {
    if (Tts) Tts.speak(text);
  } catch {}
}

// ------------------------------------------------------------
// 📍 GET LOCATION
// ------------------------------------------------------------
async function getLocation() {
  try {
    const Geo = require("react-native-geolocation-service");
    return await new Promise((resolve, reject) => {
      Geo.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// 💾 SAVE ACCIDENT EVENT
// ------------------------------------------------------------
async function saveAccident(payload, coords) {
  try {
    const ref = await addDoc(collection(db, "accident_events"), {
      deviceId: payload.device_id || payload.id || "unknown",
      crash: true,
      accel: payload.accel || {},
      gyro: payload.gyro || {},
      impactG: payload.impact_magnitude_g || payload.gz || null,
      location: coords
        ? new GeoPoint(coords.latitude, coords.longitude)
        : null,
      createdAt: serverTimestamp(),
    });

    console.log("✅ Accident saved:", ref.id);
    return ref.id;
  } catch (e) {
    console.log("❌ Accident save failed:", e);
    return null;
  }
}

// ------------------------------------------------------------
// 📞 CALL EMERGENCY CONTACT
// ------------------------------------------------------------
async function callEmergency(number) {
  if (!number) return false;

  try {
    if (Platform.OS === "android" && DirectCall?.makeCall) {
      await DirectCall.makeCall(number);
      return true;
    }
    await Linking.openURL(`tel:${number}`);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------
// 🌍 FIND USERS WITHIN 1.5 KM
// ------------------------------------------------------------
async function findNearbyUsers(coords) {
  if (!coords) return [];

  const snap = await getDocs(collection(db, "users"));
  const R = 6371;
  const toRad = d => d * Math.PI / 180;

  const distance = (a, b) => {
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  let nearby = [];

  snap.forEach(docSnap => {
    const d = docSnap.data();
    if (!d.location) return;

    const dist = distance(coords, {
      latitude: d.location.latitude,
      longitude: d.location.longitude,
    });

    if (dist <= 1.5) {
      nearby.push({ id: docSnap.id, ...d, distance: dist });
    }
  });

  console.log("📡 Nearby users:", nearby.length);
  return nearby;
}

// ------------------------------------------------------------
// 📢 SEND IN-APP ALERTS
// ------------------------------------------------------------
async function notifyUsers(eventId, victim, users, coords) {
  const col = collection(db, "alerts");

  for (let u of users) {
    await addDoc(col, {
      eventId,
      userId: u.id,
      victimName: victim.name || "Unknown",
      emergencyContact: victim.emergencyContact || "",
      location: coords
        ? new GeoPoint(coords.latitude, coords.longitude)
        : null,
      seen: false,
      createdAt: serverTimestamp(),
    });
  }

  console.log("🚀 Alerts sent:", users.length);
  return users.length;
}

// ------------------------------------------------------------
// ⭐ MAIN EXPORT — THIS IS WHAT YOUR APP CALLS
// ------------------------------------------------------------
export async function handleConfirmedImpact(payload) {
  console.log("🔥 HANDLE CONFIRMED IMPACT");

  speak("Accident confirmed. Sending emergency alert.");

  // 1️⃣ Location
  const coords = await getLocation();

  // 2️⃣ Save event
  const eventId = await saveAccident(payload, coords);

  // 3️⃣ Emergency contact
  const emergencyNumber = await AsyncStorage.getItem("@emergency_number");

  // 4️⃣ Call emergency
  const callDone = emergencyNumber
    ? await callEmergency(emergencyNumber)
    : false;

  // 5️⃣ Victim info
  const victim = {
    name: await AsyncStorage.getItem("@user_name"),
    emergencyContact: emergencyNumber,
  };

  // 6️⃣ Nearby users
  const nearbyUsers = await findNearbyUsers(coords);

  // 7️⃣ In-app alerts
  const notifiedCount = await notifyUsers(
    eventId,
    victim,
    nearbyUsers,
    coords
  );

  // 🔁 RETURN STATUS FOR UI / DEBUG
  return {
    success: true,
    eventId,
    emergencyCalled: callDone,
    notifiedUsers: notifiedCount,
    location: coords,
  };
}
