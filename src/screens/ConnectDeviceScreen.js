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
  // ---------------------------
  //  🔥 HOOKS (NEVER CONDITIONAL)
  // ---------------------------
  const bleRef = useRef(null);

  const [status, setStatus] = useState("Not connected");
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [demoMode, setDemoMode] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [impactPayload, setImpactPayload] = useState(null);

  // ---------------------------
  //  🔥 ASK BLUETOOTH PERMISSIONS
  // ---------------------------
  async function requestBlePermissions() {
    if (Platform.OS !== "android") return true;

    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const granted =
        result["android.permission.BLUETOOTH_SCAN"] === "granted" &&
        result["android.permission.BLUETOOTH_CONNECT"] === "granted" &&
        result["android.permission.ACCESS_FINE_LOCATION"] === "granted";

      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Enable Bluetooth & Location permissions to connect your AvRak helmet."
        );
      }

      return granted;
    } catch (err) {
      console.log("Permission error:", err);
      return false;
    }
  }

  // ---------------------------
  //  🔥 INIT BLE LISTENER
  // ---------------------------
  useEffect(() => {
    bleRef.current = new BleListener(handleImpact);

    return () => {
      bleRef.current?.disconnect();
    };
  }, []);

  // ---------------------------
  //  🔥 ON IMPACT DETECTED
  // ---------------------------
  function handleImpact(payload) {
    Vibration.vibrate([300, 300, 300]);

    setImpactPayload(payload);
    setModalVisible(true);

    setStatus("Impact detected!");
  }

  // ---------------------------
  //  🔥 SCAN + CONNECT DEVICE
  // ---------------------------
  async function startScan() {
    if (demoMode) {
      Alert.alert("Demo Mode Active", "Turn off demo mode to use Bluetooth.");
      return;
    }

    const ok = await requestBlePermissions();
    if (!ok) return;

    if (!bleRef.current) {
      Alert.alert("Error", "Bluetooth system not initialized.");
      return;
    }

    try {
      setScanning(true);
      setStatus("Scanning...");

      const found = await bleRef.current.startScan();

      setScanning(false);

      if (found) {
        setConnected(true);
        setStatus("Helmet Connected");
      } else {
        setStatus("No Helmet Found");
      }
    } catch (err) {
      setScanning(false);
      setStatus("Scan Error");
      console.log(err);
      Alert.alert("BLE Error", err.message || "Could not scan device.");
    }
  }

  // ---------------------------
  //  🔥 DISCONNECT HELMET
  // ---------------------------
  async function disconnect() {
    try {
      await bleRef.current?.disconnect();
      setConnected(false);
      setStatus("Disconnected");
    } catch (err) {
      console.log("Disconnect error:", err);
    }
  }

  // ---------------------------
  //  🔥 SIMULATE ACCIDENT (DEMO)
  // ---------------------------
  function simulateImpact() {
    const fake = {
      type: "impact",
      seq: Math.floor(Math.random() * 99999),
      ts: Date.now(),
      device_id: "helmet-demo",
      accel: { x: 0.44, y: -0.22, z: 9.81 },
      gyro: { x: 0.03, y: 0.01, z: 0.02 },
      impact_magnitude_g: 4.8,
    };

    handleImpact(fake);
  }

  // ---------------------------
  //  🔥 MODAL ACTIONS
  // ---------------------------
  async function cancelAlert() {
    setModalVisible(false);
    setImpactPayload(null);
    setStatus("Cancelled");
  }

  async function timeoutAlert() {
    setModalVisible(false);

    if (!impactPayload) return;

    try {
      setStatus("Sending emergency alert...");
      await handleConfirmedImpact(impactPayload);
      setStatus("Alert Sent");
    } catch (err) {
      setStatus("Alert Failed");
      console.log(err);
    }

    setImpactPayload(null);
  }

  // ---------------------------
  //  🔥 UI
  // ---------------------------
  return (
    <View style={styles.container}>
      <Image source={LOGO} style={styles.logo} />

      <Text style={styles.title}>Connect Your AvRak Helmet</Text>

      <Text style={styles.status}>
        Status: <Text style={{ fontWeight: "bold" }}>{status}</Text>
      </Text>

      <View style={{ height: 15 }} />

      {/* BUTTONS ROW */}
      <View style={styles.row}>
        <Button
          title={scanning ? "Scanning..." : "Scan & Connect"}
          onPress={startScan}
          color="#0275d8"
          disabled={scanning || demoMode}
        />

        <View style={{ width: 10 }} />

        <Button
          title="Disconnect"
          color="#d9534f"
          disabled={!connected}
          onPress={disconnect}
        />
      </View>

      {/* DEMO MODE */}
      <View style={styles.demoRow}>
        <Text style={{ fontSize: 16 }}>Demo Mode</Text>
        <Switch value={demoMode} onValueChange={setDemoMode} />
      </View>

      <Button title="Simulate Accident" color="#f0ad4e" onPress={simulateImpact} />

      {scanning && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {/* IMPACT CONFIRMATION MODAL */}
      <ConfirmModal
        visible={modalVisible}
        seconds={30}
        onCancel={cancelAlert}
        onTimeout={timeoutAlert}
      />
    </View>
  );
}

// ---------------------------
//  🔥 STYLES
// ---------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: {
    width: 110,
    height: 110,
    marginTop: 30,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  status: {
    marginTop: 5,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    marginTop: 15,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    gap: 10,
  },
});
