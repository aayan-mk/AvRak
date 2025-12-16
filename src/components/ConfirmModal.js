// src/components/ConfirmModal.js

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from "react-native";

export default function ConfirmModal({
  visible,
  seconds = 30,
  onCancel,
  onTimeout,
  onConfirmNow,
}) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const timerRef = useRef(null);
  const triggeredRef = useRef(false); // prevents double firing

  // ------------------------------------------------
  // START / STOP TIMER BASED ON `visible`
  // ------------------------------------------------
  useEffect(() => {
    if (!visible) {
      cleanup();
      return;
    }

    triggeredRef.current = false;
    setTimeLeft(seconds);

    // Alarm-style vibration
    Vibration.vibrate([400, 600], true);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return cleanup;
  }, [visible, seconds]);

  // ------------------------------------------------
  // AUTO TIMEOUT
  // ------------------------------------------------
  useEffect(() => {
    if (!visible) return;
    if (timeLeft > 0) return;
    if (triggeredRef.current) return;

    triggeredRef.current = true;
    cleanup();

    // run outside render cycle
    setTimeout(() => {
      onTimeout && onTimeout();
    }, 0);
  }, [timeLeft, visible, onTimeout]);

  // ------------------------------------------------
  // CLEANUP (single source of truth)
  // ------------------------------------------------
  function cleanup() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    Vibration.cancel();
  }

  // ------------------------------------------------
  // BUTTON HANDLERS
  // ------------------------------------------------
  function handleSafe() {
    triggeredRef.current = true;
    cleanup();
    onCancel && onCancel();
  }

  function handleConfirmNow() {
    triggeredRef.current = true;
    cleanup();
    onConfirmNow && onConfirmNow();
  }

  // ------------------------------------------------
  // UI (NO CONDITIONAL HOOKS ABOVE THIS)
  // ------------------------------------------------
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>

          <Text style={styles.title}>🚨 Accident Detected</Text>

          <Text style={styles.subtitle}>
            Sending emergency alert in{" "}
            <Text style={styles.timer}>{timeLeft}s</Text>
          </Text>

          <View style={{ height: 20 }} />

          <TouchableOpacity
            style={[styles.btn, styles.safeBtn]}
            onPress={handleSafe}
          >
            <Text style={styles.btnText}>I’m Safe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.helpBtn]}
            onPress={handleConfirmNow}
          >
            <Text style={styles.btnText}>Send Help Now</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ------------------------------------------------
// STYLES
// ------------------------------------------------
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "88%",
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 14,
    elevation: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    color: "#d9534f",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  timer: {
    fontWeight: "800",
    color: "#d9534f",
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
  },
  safeBtn: {
    backgroundColor: "#28a745",
  },
  helpBtn: {
    backgroundColor: "#d9534f",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
