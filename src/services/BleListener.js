// ------------------------------------------------------------
//  BLE LISTENER FOR AVRAK HELMET (ESP32)
//  + DEMO MODE FOR TESTING WITHOUT HARDWARE
// ------------------------------------------------------------
import { Platform, PermissionsAndroid } from "react-native";
import { Buffer } from "buffer";

let BleManagerClass;
try {
  BleManagerClass = require("react-native-ble-plx").BleManager;
} catch {
  BleManagerClass = null;
}

// ------------------------------------------------------------
//  UUIDs (MATCH ESP32 CODE)
// ------------------------------------------------------------
const SERVICE_UUID = "180a";
const CHAR_UUID_NOTIFY = "2a57";
const DEVICE_PREFIX = "AvRak_Helmet_";

export default class BleListener {
  constructor(onImpact, demoMode = false) {
    this.onImpact = onImpact;

    this.demoMode = demoMode;      // ⭐ NEW
    this.manager = BleManagerClass ? new BleManagerClass() : null;

    this.connectedDevice = null;
    this.subscription = null;
  }

  // ------------------------------------------------------------
  //  DEMO MODE — Fake Accident JSON
  // ------------------------------------------------------------
  simulateImpact() {
    const fakePayload = {
      id: "DEMO_HELMET_001",
      gx: 0.4,
      gy: 0.2,
      gz: 3.5,
      crash: 1,           // ACCIDENT DETECTED
      ts: Date.now()
    };

    console.log("🔥 DEMO IMPACT TRIGGERED:", fakePayload);

    // Call main impact handler
    this.onImpact && this.onImpact(fakePayload);
  }

  // ------------------------------------------------------------
  // HANDLE ANDROID PERMISSIONS
  // ------------------------------------------------------------
  async ensurePermissions() {
    if (Platform.OS !== "android") return true;

    try {
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
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------
  // SCAN FOR HELMET
  // ------------------------------------------------------------
  async startScan(timeoutMs = 10000) {
    // ⭐ DEMO MODE SHORTCUT
    if (this.demoMode) {
      console.log("📱 Demo Mode: Skipping scan, no ESP32 required");
      return true;
    }

    if (!this.manager) throw new Error("BLE Manager unavailable");

    const ok = await this.ensurePermissions();
    if (!ok) throw new Error("Bluetooth permissions denied");

    return new Promise((resolve) => {
      let found = false;

      this.manager.startDeviceScan(null, { scanMode: 2 }, async (err, device) => {
        if (err) {
          console.log("Scan error:", err);
          this.manager.stopDeviceScan();
          return resolve(false);
        }

        if (!device?.name) return;

        if (device.name.startsWith(DEVICE_PREFIX)) {
          found = true;
          this.manager.stopDeviceScan();
          console.log("Helmet found:", device.name);

          try {
            await this.connect(device);
            resolve(true);
          } catch {
            resolve(false);
          }
        }
      });

      setTimeout(() => {
        if (!found) {
          try { this.manager.stopDeviceScan(); } catch {}
          resolve(false);
        }
      }, timeoutMs);
    });
  }

  // ------------------------------------------------------------
  // CONNECT TO HELMET
  // ------------------------------------------------------------
  async connect(device) {
    if (this.demoMode) {
      console.log("📱 Demo Mode: Skipping actual connect");
      return true;
    }

    try {
      const connected = await this.manager.connectToDevice(device.id, {
        autoConnect: true,
      });

      await connected.discoverAllServicesAndCharacteristics();
      this.connectedDevice = connected;

      console.log("Connected:", connected.name);

      this.monitorNotifications();
    } catch (err) {
      throw err;
    }
  }

  // ------------------------------------------------------------
  // READ ESP32 NOTIFICATION DATA
  // ------------------------------------------------------------
  monitorNotifications() {
    if (!this.connectedDevice) return;

    this.subscription = this.connectedDevice.monitorCharacteristicForService(
      SERVICE_UUID,
      CHAR_UUID_NOTIFY,
      (error, characteristic) => {
        if (error) {
          console.log("Notify error:", error);
          return;
        }

        if (!characteristic?.value) return;

        try {
          const decoded = Buffer.from(characteristic.value, "base64").toString("utf8");
          const json = JSON.parse(decoded);

          console.log("BLE JSON:", json);

          if (json.crash === 1) {
            this.onImpact(json);
          }
        } catch (err) {
          console.log("JSON parse error:", err);
        }
      }
    );
  }

  // ------------------------------------------------------------
  // DISCONNECT
  // ------------------------------------------------------------
  async disconnect() {
    if (this.subscription) this.subscription.remove();

    if (this.connectedDevice) {
      try {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      } catch {}
    }

    this.subscription = null;
    this.connectedDevice = null;
  }
}
