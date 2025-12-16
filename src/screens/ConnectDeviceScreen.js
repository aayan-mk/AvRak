// src/screens/ConnectDeviceScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  PermissionsAndroid,
  Platform,
  Vibration,
} from "react-native";

import BleListener from "../services/BleListener";
import ConfirmModal from "../components/ConfirmModal";
import { handleConfirmedImpact } from "../services/AlertHandler";

const LOGO = require("../../assets/logo.png");

export default function ConnectDeviceScreen() {
  const bleRef = useRef(null);

  const [status, setStatus] = useState("Not connected");
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [connectedName, setConnectedName] = useState(null);

  const [demoMode, setDemoMode] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [impactPayload, setImpactPayload] = useState(null);

  // --------------------------------------------------
  // INIT BLE LISTENER
  // --------------------------------------------------
  useEffect(() => {
    bleRef.current = new BleListener(handleImpact);

    return () => {
      bleRef.current?.disconnect();
      bleRef.current = null;
    };
  }, []);

  // --------------------------------------------------
  // IMPACT RECEIVED FROM BLE / DEMO
  // --------------------------------------------------
  function handleImpact(payload) {
    Vibration.vibrate([300, 200, 300]);
    setImpactPayload(payload);
    setModalVisible(true);
    setStatus("Impact detected!");
  }

  // --------------------------------------------------
  // ANDROID PERMISSIONS
  // --------------------------------------------------
  async function requestBlePermissions() {
    if (Platform.OS !== "android") return true;

    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return (
      result["android.permission.BLUETOOTH_SCAN"] === "granted" &&
      result["android.permission.BLUETOOTH_CONNECT"] === "granted" &&
      result["android.permission.ACCESS_FINE_LOCATION"] === "granted"
    );
  }

  // --------------------------------------------------
  // SCAN & CONNECT
  // --------------------------------------------------
  async function startScan() {
    if (demoMode) {
      Alert.alert("Demo Mode", "Disable Demo Mode to connect real helmet.");
      setStatus("Demo Mode active");
      return;
    }

    if (scanning) return;

    const ok = await requestBlePermissions();
    if (!ok) return;

    setScanning(true);
    setStatus("Scanning...");

    try {
      const found = await bleRef.current.startScan(12000);
      setScanning(false);

      if (found) {
        setConnected(true);
        setConnectedName(bleRef.current?.connectedDevice?.name || null);
        setStatus("Helmet connected");
      } else {
        setStatus("No helmet found");
      }
    } catch (err) {
      setScanning(false);
      setStatus("Scan error");
      Alert.alert("Scan Error", "Unable to scan helmet");
    }
  }

  // --------------------------------------------------
  // DISCONNECT
  // --------------------------------------------------
  async function disconnect() {
    await bleRef.current?.disconnect();
    setConnected(false);
    setConnectedName(null);
    setStatus("Disconnected");
  }

  // --------------------------------------------------
  // DEMO ACCIDENT
  // --------------------------------------------------
  function simulateImpact() {
    handleImpact({
      device_id: "helmet-demo",
      ts: Date.now(),
      impact_magnitude_g: 5.2,
      crash: 1,
    });
  }

  // --------------------------------------------------
  // MODAL ACTIONS
  // --------------------------------------------------
  function cancelAlert() {
    setModalVisible(false);
    setImpactPayload(null);
    setStatus("Cancelled");
  }

  async function timeoutAlert() {
    setModalVisible(false);

    if (!impactPayload) return;

    try {
      setStatus("Sending emergency alert...");

      const result = await handleConfirmedImpact(impactPayload);

      setStatus("Alert sent");

      Alert.alert(
        "🚨 Emergency Alert Sent",
        `Emergency Call: ${result.emergencyCalled ? "Done" : "Not placed"}\nNearby Users Notified: ${result.notifiedUsers}`
      );
    } catch (err) {
      setStatus("Alert failed");
      Alert.alert("Error", "Failed to send emergency alert");
    }

    setImpactPayload(null);
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <View style={styles.container}>
      <Image source={LOGO} style={styles.logo} />

      <Text style={styles.title}>Connect Your AvRak Helmet</Text>

      <Text style={styles.status}>
        Status: <Text style={{ fontWeight: "700" }}>{status}</Text>
      </Text>

      {connectedName && (
        <Text style={styles.connected}>Connected to: {connectedName}</Text>
      )}

      <View style={{ height: 14 }} />

      <View style={styles.row}>
        <Button
          title={scanning ? "Scanning..." : "Scan & Connect"}
          onPress={startScan}
          disabled={scanning || demoMode}
        />

        <View style={{ width: 10 }} />

        <Button
          title="Disconnect"
          onPress={disconnect}
          disabled={!connected}
          color="#d9534f"
        />
      </View>

      <View style={styles.demoRow}>
        <Text>Demo Mode</Text>
        <Switch value={demoMode} onValueChange={setDemoMode} />
        <Button title="Show Demo" onPress={simulateImpact} />
      </View>

      {scanning && <ActivityIndicator style={{ marginTop: 16 }} />}

      <ConfirmModal
        visible={modalVisible}
        seconds={30}
        onCancel={cancelAlert}
        onTimeout={timeoutAlert}
      />
    </View>
  );
}

// --------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20 },
  logo: { width: 110, height: 110, marginTop: 30 },
  title: { fontSize: 20, fontWeight: "700", marginVertical: 10 },
  status: { fontSize: 15 },
  connected: { fontSize: 14, fontStyle: "italic" },
  row: { flexDirection: "row", marginTop: 15 },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 15,
  },
});
