import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import * as Animatable from "react-native-animatable";

import { auth, db } from "../services/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

const LOGO = require("../../assets/logo.png");

// 🔥 Custom animation for breathing glow pulse
const pulse = {
  0: { transform: [{ scale: 1 }], opacity: 0.9 },
  0.5: { transform: [{ scale: 1.08 }], opacity: 1 },
  1: { transform: [{ scale: 1 }], opacity: 0.9 },
};

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

    const unsub = onSnapshot(refUser, (snap) => {
      if (snap.exists()) {
        setName(snap.data()?.name || "");
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  return (
    <View style={styles.container}>
      
      {/* PULSE ANIMATION LOGO */}
      <Animatable.View
        animation={pulse}
        easing="ease-in-out"
        iterationCount="infinite"
        duration={2200}
        style={styles.logoWrapper}
      >
        <Animatable.Image
          animation="zoomIn"
          duration={900}
          delay={200}
          source={LOGO}
          style={styles.logo}
        />
      </Animatable.View>

      {/* TITLE */}
      <Animatable.Text
        animation="fadeInDown"
        duration={700}
        delay={400}
        style={styles.title}
      >
        Welcome to AvRak
      </Animatable.Text>

      {/* NAME / LOADER */}
      {loading ? (
        <Animatable.View animation="fadeIn" duration={600} delay={300}>
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        </Animatable.View>
      ) : (
        <Animatable.Text
          animation="fadeInUp"
          duration={900}
          delay={600}
          style={styles.subtitle}
        >
          {name ? `Hello, ${name}` : "Welcome!"}
        </Animatable.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  logoWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 130,
    height: 130,
    marginBottom: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
    color: "#000",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 18,
    color: "#555",
    fontWeight: "600",
  },
});
