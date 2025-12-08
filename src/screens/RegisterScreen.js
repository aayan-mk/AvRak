import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  ScrollView
} from "react-native";

import { auth, db } from "../services/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const LOGO = require("../../assets/logo.png");

export default function RegisterScreen({ navigation }) {
  // ---------------- HOOKS ----------------
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ---------------- REGISTER ----------------
  async function register() {
    if (!name || !mobile || !email || !password || !confirm) {
      return Alert.alert("Missing Fields", "Please fill out everything.");
    }

    if (password !== confirm) {
      return Alert.alert("Password Error", "Passwords do not match.");
    }

    try {
      // 1️⃣ Create Firebase user
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // 2️⃣ Add user to Firestore
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        name,
        mobile,
        email,
        emergencyContact: "",
        address: "",
        gender: "",
        bloodGroup: "",
        photoURL: "",
        createdAt: Date.now(),
      });

      Alert.alert("Success", "Account created. Please login.");
      navigation.navigate("Login");

    } catch (err) {
      console.log(err);
      let msg = err.message;

      if (msg.includes("email-already")) msg = "This email is already registered.";
      if (msg.includes("invalid-email")) msg = "Invalid email format.";

      Alert.alert("Register Error", msg);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* BACK BUTTON */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backBtn}>← Back</Text>
      </TouchableOpacity>

      <Image source={LOGO} style={styles.logo} />

      <Text style={styles.title}>Create Your AvRak Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirm}
        secureTextEntry
        onChangeText={setConfirm}
      />

      <Button title="Register" onPress={register} />

      <Text
        style={styles.loginLink}
        onPress={() => navigation.navigate("Login")}
      >
        Already have an account? Login
      </Text>

    </ScrollView>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  backBtn: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 10,
    fontWeight: "600",
  },
  logo: {
    width: 110,
    height: 110,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  loginLink: {
    textAlign: "center",
    marginTop: 15,
    color: "#007AFF",
    fontWeight: "600",
  },
});
