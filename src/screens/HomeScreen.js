import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import * as Animatable from "react-native-animatable";

import { auth, db } from "../services/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

const LOGO = require("../../assets/logo.png");

export default function HomeScreen() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setName("");
      setLoading(false);
      return;
    }

    const refUser = doc(db, "users", user.uid);

    const unsub = onSnapshot(refUser, snap => {
      if (snap.exists()) {
        setName(snap.data()?.name || "");
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  return (
    <View style={styles.container}>
      
      {/* LOGO ANIMATION */}
      <Animatable.Image
        animation="zoomIn"
        duration={800}
        delay={100}
        source={LOGO}
        style={styles.logo}
      />

      {/* TITLE ANIMATION */}
      <Animatable.Text
        animation="fadeInDown"
        duration={700}
        style={styles.title}
      >
        Welcome to AvRak
      </Animatable.Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <Animatable.Text
          animation="fadeInUp"
          duration={900}
          delay={200}
          iterationCount={1}
          style={styles.subtitle}
        >
          {name ? `Hello, ${name}` : "Welcome!"}
        </Animatable.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },

  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
    color: "#000",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 18,
    color: "#444",
    fontWeight: "600",
  },
});
