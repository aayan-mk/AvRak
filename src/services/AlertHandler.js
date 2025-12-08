import { Platform, NativeModules, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let Tts;
try { Tts = require("react-native-tts"); } catch (e) { Tts = null; }

let firestore;
try { firestore = require("@react-native-firebase/firestore").default; } catch (e) { firestore = null; }

const { DirectCall } = NativeModules || {};

function speak(text) {
  if (Tts && Tts.speak) {
    try { Tts.speak(text); } catch (e) {}
  }
}

async function saveEvent(payload, coords) {
  if (!firestore) return null;
  try {
    const doc = await firestore().collection("accident_events").add({
      deviceId: payload.device_id || "unknown",
      ts: payload.ts || Date.now(),
      impact_g: payload.impact_magnitude_g || payload.impact_g || null,
      accel: payload.accel || {},
      gyro: payload.gyro || {},
      location: coords ? new firestore.GeoPoint(coords.latitude, coords.longitude) : null,
      createdAt: firestore.FieldValue.serverTimestamp()
    });
    return doc.id;
  } catch (e) {
    console.warn("Firestore write failed", e);
    return null;
  }
}

async function callNumber(number) {
  if (!number) return;
  if (Platform.OS === "android" && DirectCall && DirectCall.makeCall) {
    try {
      await DirectCall.makeCall(number);
      return;
    } catch (e) {
      console.warn("DirectCall failed, falling back to dialer", e);
    }
  }
  try {
    await Linking.openURL(`tel:${number}`);
  } catch (e) {
    console.warn("Failed to open dialer", e);
  }
}

/**
 * Called after the 10s confirmation timer ends
 */
export async function handleConfirmedImpact(payload) {
  speak("Accident confirmed. Notifying emergency contact.");
  let coords = null;
  // try to get geo if geolocation lib is installed (optional)
  try {
    const Geo = require("react-native-geolocation-service");
    coords = await new Promise((resolve, reject) => {
      Geo.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    });
  } catch (e) {
    // geolocation lib not installed or permission denied
    coords = null;
  }

  const eventId = await saveEvent(payload, coords);

  const emergencyNumber = await AsyncStorage.getItem("@emergency_number");
  if (emergencyNumber) {
    await callNumber(emergencyNumber);
  } else {
    // open dialer with no number
    try { await Linking.openURL("tel:"); } catch {}
  }

  return { eventId, location: coords };
}
