// src/utils/logout.js
import { getAuth, signOut } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function logoutUser() {
  try {
    // Clear ALL async storage keys
    await AsyncStorage.clear();

    // Log out from Firebase
    const auth = getAuth();
    await signOut(auth);

    console.log("User logged out + AsyncStorage wiped");
    return true;

  } catch (error) {
    console.log("Logout error:", error);
    return false;
  }
}
