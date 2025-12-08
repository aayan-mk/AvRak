// src/screens/LoginScreen.js
import React, { useState } from "react";
import {
  View, Text, TextInput, Button, StyleSheet, Image, Alert
} from "react-native";

import { auth, db } from "../services/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const LOGO = require("../../assets/logo.png");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    if (!email || !password) return Alert.alert("Enter all fields");

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);

      await setDoc(
        doc(db, "users", res.user.uid),
        { email, lastLogin: Date.now() },
        { merge: true }
      );

      // AppNavigator will auto-redirect
    } catch (err) {
      Alert.alert("Login Error", err.message);
    }
  }

  return (
    <View style={styles.container}>
      <Image source={LOGO} style={styles.logo} />
      <Text style={styles.title}>Login to AvRak</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={login} />

      <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
        Create account
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:"center", padding:20 },
  logo: { width:110, height:110, alignSelf:"center", marginBottom:12 },
  title: { fontSize:22, fontWeight:"700", textAlign:"center", marginBottom:12 },
  input: { borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:8, marginBottom:12 },
  link: { textAlign:"center", marginTop:10, color:"#007AFF", fontWeight:"600" }
});
