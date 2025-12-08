// src/components/ConfirmModal.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Button,
  Vibration,
} from "react-native";

export default function ConfirmModal({ visible, seconds = 30, onCancel, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (!visible) return;

    setTimeLeft(seconds);

    // 🔊 Pattern vibration for loud warning
    const vibrationPattern = [500, 500, 500, 500, 500];
    Vibration.vibrate(vibrationPattern, true);

    const timer = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          Vibration.cancel();
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      Vibration.cancel();
      clearInterval(timer);
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Possible Accident Detected</Text>
          <Text style={styles.subtitle}>
            Sending alert in {timeLeft} seconds...
          </Text>

          <View style={{ height: 15 }} />

          <Button title="I am Safe (Cancel)" color="#28a745" onPress={() => {
            Vibration.cancel();
            onCancel();
          }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#444",
  },
});
