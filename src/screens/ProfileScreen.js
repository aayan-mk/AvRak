// src/screens/ProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Alert,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

import { launchImageLibrary } from "react-native-image-picker";
import { Picker } from "@react-native-picker/picker"; // ✅ DROPDOWN PICKER

// Firebase
import { auth, db, storage } from "../services/firebaseConfig";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [userData, setUserData] = useState(null);
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [gender, setGender] = useState("");

  // ---------------------------------------------
  // LOAD USER DATA
  // ---------------------------------------------
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return setLoading(false);

    const userRef = doc(db, "users", user.uid);

    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();

        setUserData(data);
        setEmergencyContact(data?.emergencyContact || "");
        setAddress(data?.address || "");
        setPhotoURL(data?.photoURL || "");
        setBloodGroup(data?.bloodGroup || "");
        setGender(data?.gender || "");
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  // ---------------------------------------------
  // PICK IMAGE
  // ---------------------------------------------
  const pickImage = () => {
    if (!editing) return;

    launchImageLibrary({ mediaType: "photo", quality: 0.8 }, async (res) => {
      if (res.didCancel) return;
      if (res.errorCode) return Alert.alert("Image Error", res.errorMessage);

      const uri = res.assets[0].uri;
      uploadImage(uri);
    });
  };

  // ---------------------------------------------
  // UPLOAD IMAGE → FIREBASE STORAGE
  // ---------------------------------------------
  const uploadImage = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const imgRef = ref(storage, `profilePictures/${user.uid}.jpg`);

      const response = await fetch(uri);
      const blob = await response.blob();

      await uploadBytes(imgRef, blob);

      const url = await getDownloadURL(imgRef);
      setPhotoURL(url);
    } catch (err) {
      Alert.alert("Upload Error", err.message);
    }
  };

  // ---------------------------------------------
  // SAVE PROFILE
  // ---------------------------------------------
  const saveProfile = async () => {
    try {
      const user = auth.currentUser;

      await setDoc(
        doc(db, "users", user.uid),
        {
          emergencyContact,
          address,
          bloodGroup,
          gender,
          photoURL,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      Alert.alert("Saved!", "Profile updated.");
      setEditing(false);
    } catch (err) {
      Alert.alert("Save Error", err.message);
    }
  };

  // ---------------------------------------------
  // LOGOUT
  // ---------------------------------------------
  const logout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      Alert.alert("Logout Error", err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  const readOnly = !editing;

  return (
    <ScrollView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => (editing ? saveProfile() : setEditing(true))}>
          <Text style={styles.editBtn}>{editing ? "Save" : "Edit"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={logout}>
          <Text style={[styles.editBtn, { color: "red" }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Image */}
      <TouchableOpacity disabled={!editing} onPress={pickImage}>
        <Image
          source={photoURL ? { uri: photoURL } : require("../../assets/avatar.png")}
          style={styles.profileImage}
        />
      </TouchableOpacity>

      <Text style={styles.title}>Your Profile</Text>

      {/* Static fields */}
      <Text style={styles.staticField}>Name: {userData?.name}</Text>
      <Text style={styles.staticField}>Email: {userData?.email}</Text>
      <Text style={styles.staticField}>Mobile: {userData?.mobile}</Text>

      {/* Editable fields */}
      <Text style={styles.label}>Emergency Contact</Text>
      <TextInput
        value={emergencyContact}
        editable={editing}
        onChangeText={setEmergencyContact}
        style={[styles.input, readOnly && styles.disabled]}
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        value={address}
        editable={editing}
        multiline
        onChangeText={setAddress}
        style={[styles.textArea, readOnly && styles.disabled]}
      />

      {/* BLOOD GROUP DROPDOWN */}
      <Text style={styles.label}>Blood Group</Text>
      <View style={[styles.pickerWrapper, readOnly && styles.disabled]}>
        <Picker
          enabled={editing}
          selectedValue={bloodGroup}
          onValueChange={(value) => setBloodGroup(value)}
        >
          <Picker.Item label="Select Blood Group" value="" />
          <Picker.Item label="A+" value="A+" />
          <Picker.Item label="A-" value="A-" />
          <Picker.Item label="B+" value="B+" />
          <Picker.Item label="B-" value="B-" />
          <Picker.Item label="O+" value="O+" />
          <Picker.Item label="O-" value="O-" />
          <Picker.Item label="AB+" value="AB+" />
          <Picker.Item label="AB-" value="AB-" />
        </Picker>
      </View>

      {/* GENDER DROPDOWN */}
      <Text style={styles.label}>Gender</Text>
      <View style={[styles.pickerWrapper, readOnly && styles.disabled]}>
        <Picker
          enabled={editing}
          selectedValue={gender}
          onValueChange={(value) => setGender(value)}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ---------------------------------------------
// STYLES
// ---------------------------------------------
const styles = StyleSheet.create({
  container: { padding: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  editBtn: {
    fontSize: 16,
    fontWeight: "700",
  },

  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    textAlign: "center",
    fontWeight: "700",
    marginVertical: 10,
  },

  staticField: { fontSize: 16, marginBottom: 6 },

  label: { marginTop: 15, fontWeight: "600", marginBottom: 5 },

  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  textArea: {
    borderWidth: 1,
    borderColor: "#bbb",
    padding: 12,
    borderRadius: 8,
    height: 110,
    marginBottom: 12,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    marginBottom: 12,
  },

  disabled: { backgroundColor: "#e9e9e9" },
});
