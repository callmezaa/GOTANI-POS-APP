import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function ScanQRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState("");

  useEffect(() => {
    if (!permission || permission.status !== "granted") {
      requestPermission(); // Minta izin kamera
    }
  }, [permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setData(data);
    alert(`QR Code Scanned: ${data}`);
  };

  if (!permission || permission.status !== "granted") {
    return <Text>Meminta izin kamera...</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }} // Hanya untuk QR Code
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {scanned && <Button title="Scan Lagi" onPress={() => setScanned(false)} />}
      {data ? <Text style={styles.text}>Data: {data}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { flex: 1, width: "100%" },
  text: { marginTop: 20, fontSize: 16 },
});
