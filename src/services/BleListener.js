import { Platform, PermissionsAndroid } from "react-native";
import { Buffer } from "buffer";

let BleManagerClass;
try {
  BleManagerClass = require("react-native-ble-plx").BleManager;
} catch {
  BleManagerClass = null;
}

// ---------------------------
// UUIDs for ESP32 HELMET
// ---------------------------
const SERVICE_UUID = "0000abcd-0000-1000-8000-00805f9b34fb";
const CHAR_UUID_NOTIFY = "0000dcba-0000-1000-8000-00805f9b34fb";
const DEVICE_PREFIX = "Helmet";

export default class BleListener {
  constructor(onImpact) {
    this.onImpact = onImpact;
    this.manager = BleManagerClass ? new BleManagerClass() : null;
    this.connectedDevice = null;
    this.subscription = null;
  }

  // ---------------------------------------------------------
  // ANDROID 12+ RUNTIME PERMISSIONS CHECK
  // ---------------------------------------------------------
  async ensurePermissions() {
    if (Platform.OS !== "android") return true;

    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      ]);

      const scanOk = result["android.permission.BLUETOOTH_SCAN"] === "granted";
      const connOk = result["android.permission.BLUETOOTH_CONNECT"] === "granted";
      const locOk = result["android.permission.ACCESS_FINE_LOCATION"] === "granted";

      return scanOk && connOk && locOk;
    } catch (e) {
      console.warn("Permission error:", e);
      return false;
    }
  }

  // ---------------------------------------------------------
  // SCAN FOR HELMET DEVICE
  // ---------------------------------------------------------
  async startScan(timeoutMs = 10000) {
    if (!this.manager) throw new Error("BLE Manager not available");

    const ok = await this.ensurePermissions();
    if (!ok) throw new Error("Bluetooth permissions not granted");

    return new Promise((resolve, reject) => {
      let found = false;

      try {
        this.manager.startDeviceScan(null, { scanMode: 2 }, async (error, device) => {
          if (error) {
            console.warn("Scan error:", error);
            this.manager.stopDeviceScan();
            return reject(error);
          }

          if (!device) return;

          const name = device.name || device.localName || "";
          const matchesPrefix = name.startsWith(DEVICE_PREFIX);
          const matchesService =
            device.serviceUUIDs && device.serviceUUIDs.includes(SERVICE_UUID);

          if (matchesPrefix || matchesService) {
            found = true;
            this.manager.stopDeviceScan();

            try {
              await this.connect(device);
              resolve(true);
            } catch (e) {
              reject(e);
            }
          }
        });
      } catch (e) {
        reject(e);
      }

      // Timeout
      setTimeout(() => {
        if (!found) {
          try {
            this.manager.stopDeviceScan();
          } catch {}
          resolve(false);
        }
      }, timeoutMs);
    });
  }

  // ---------------------------------------------------------
  // CONNECT TO DEVICE
  // ---------------------------------------------------------
  async connect(device) {
    if (!this.manager) throw new Error("BLE Manager not available");

    try {
      const connected = await this.manager.connectToDevice(device.id, {
        autoConnect: false,
      });

      await connected.discoverAllServicesAndCharacteristics();

      this.connectedDevice = connected;
      this._startNotifyMonitor();

    } catch (e) {
      console.warn("BLE Connect Error:", e);
      throw new Error("Failed to connect to device");
    }
  }

  // ---------------------------------------------------------
  // MONITOR NOTIFY CHARACTERISTIC
  // ---------------------------------------------------------
  _startNotifyMonitor() {
    if (!this.connectedDevice) {
      console.warn("Cannot start monitor: no connected device");
      return;
    }

    this.subscription = this.connectedDevice.monitorCharacteristicForService(
      SERVICE_UUID,
      CHAR_UUID_NOTIFY,
      (error, characteristic) => {
        if (error) {
          console.warn("BLE monitor error:", error);
          return;
        }

        if (!characteristic?.value) return;

        try {
          const decoded = Buffer.from(characteristic.value, "base64").toString("utf8");
          const json = JSON.parse(decoded);

          if (json.type === "impact") {
            this.onImpact && this.onImpact(json);
          }
        } catch (err) {
          console.warn("Invalid BLE JSON:", err);
        }
      }
    );
  }

  // ---------------------------------------------------------
  // DISCONNECT CLEANLY
  // ---------------------------------------------------------
  async disconnect() {
    try {
      if (this.subscription && this.subscription.remove) {
        this.subscription.remove();
      }

      if (this.connectedDevice) {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      }
    } catch (e) {
      console.warn("Disconnect error:", e);
    }

    this.subscription = null;
    this.connectedDevice = null;
  }
}
