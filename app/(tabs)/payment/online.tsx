import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Alert } from "react-native";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";

import { getAuth } from "firebase/auth";
import { doc, collection, setDoc, serverTimestamp, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

import uuid from "react-native-uuid";
import { generateQRIS } from "../../../utils/qrisGenerator";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PembayaranOnline() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const total = Number(params.total || 0);
  const items = typeof params.items === "string" ? JSON.parse(params.items) : [];
  const isEmployee = params.isEmployee === "true";

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrisString, setQrisString] = useState<string | null>(null);

  const [statusText, setStatusText] = useState("Menunggu pelanggan scan QR...");

  const [loading, setLoading] = useState(true);
  const [successVisible, setSuccessVisible] = useState(false);

  const lottieRef = useRef(null);
  const listenerRef = useRef<any>(null);
  const createdRef = useRef(false);

  // ==========================
  // CREATE PAYMENT
  // ==========================
  useEffect(() => {
    if (!createdRef.current) {
      createdRef.current = true;
      createPayment();
    }

    return () => {
      // Auto remove listener on unmount
      if (listenerRef.current) listenerRef.current();
    };
  }, []);

  const createPayment = async () => {
    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;

      if (!uid) {
        Alert.alert("Error", "User tidak ditemukan. Silakan login ulang.");
        return;
      }

      setLoading(true);

      const id = uuid.v4() as string;
      setPaymentId(id);

      // Generate QRIS string
      const qris = generateQRIS(total, id);
      if (!qris) throw new Error("QRIS gagal dibuat");

      setQrisString(qris);

      const paymentRef = doc(collection(db, "users", uid, "payments"), id);

      await setDoc(paymentRef, {
        amount: total,
        items,
        status: "pending",
        paymentMethod: "qris",
        createdAt: serverTimestamp(),
        by: isEmployee ? "karyawan" : "admin",
      });

      // Start listener
      listenerRef.current = listenPayment(uid, id);

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Error", err.message || "Gagal membuat pembayaran.");
    }
  };

  // ==========================
  // LISTEN PAYMENT STATUS
  // ==========================
  const listenPayment = (uid: string, id: string) => {
    const ref = doc(db, "users", uid, "payments", id);

    return onSnapshot(ref, async (snap) => {
      const data = snap.data();
      if (!data) return;

      if (data.status === "success") {
        setSuccessVisible(true);
        setStatusText("Pembayaran diterima!");

        const auth = getAuth();
        const user = auth.currentUser;

        let adminUid = null;
        let employeeId = null;

        if (user) {
          adminUid = user.uid;
        } else {
          const stored = await AsyncStorage.getItem("employeeProfile");
          const parsed = stored ? JSON.parse(stored) : null;

          if (parsed?.adminUid && parsed?.id) {
            adminUid = parsed.adminUid;
            employeeId = parsed.id;
          }
        }

        if (!adminUid) {
          Alert.alert("Error", "Admin UID tidak ditemukan.");
          return;
        }

        // Tentukan path transaksi
        let transaksiRef;

        if (employeeId) {
          transaksiRef = doc(collection(db, `users/${adminUid}/employees/${employeeId}/transaksi`));
        } else {
          transaksiRef = doc(collection(db, `users/${adminUid}/transaksi`));
        }

        // Simpan transaksi dengan struktur premium++
        await setDoc(transaksiRef, {
          total,
          diterima: total,
          kembalian: 0,
          items,
          metode: "Online",
          paymentId: id,
          adminUid,
          created_at: serverTimestamp(),
        });

        // Kurangi stok
        for (const item of items) {
          const productRef = doc(db, `users/${adminUid}/products/${item.id}`);
          const snap = await getDoc(productRef);

          if (snap.exists()) {
            const stock = snap.data()?.stok || 0;
            await updateDoc(productRef, { stok: Math.max(0, stock - item.qty) });
          }

          if (employeeId) {
            const empRef = doc(db, `users/${adminUid}/employees/${employeeId}/products/${item.id}`);
            const empSnap = await getDoc(empRef);

            if (empSnap.exists()) {
              const stockEmp = empSnap.data()?.stok || 0;
              await setDoc(empRef, { stok: Math.max(0, stockEmp - item.qty) }, { merge: true });
            }
          }
        }

        // Pindah ke success page
        setTimeout(() => {
          setSuccessVisible(false);
          router.replace({
            pathname: "/payment/success",
            params: {
              total,
              diterima: total,
              kembalian: 0,
              paymentId: id,
            },
          });
        }, 1400);
      }
    });
  };

  // ==========================
  // MANUAL CONFIRM
  // ==========================
  const manualConfirm = async () => {
    if (!paymentId) return;

    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const ref = doc(db, "users", uid, "payments", paymentId);

      await setDoc(
        ref,
        {
          status: "success",
          confirmedAt: serverTimestamp(),
          confirmedBy: uid,
        },
        { merge: true }
      );
    } catch (e) {
      Alert.alert("Gagal", "Tidak dapat konfirmasi manual");
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pembayaran QRIS</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <Text style={styles.amount}>Rp {total.toLocaleString("id-ID")}</Text>
        <Text style={styles.status}>{statusText}</Text>

        {loading || !qrisString ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} color="#10b981" />
        ) : (
          <View style={styles.qrBox}>
            <QRCode value={qrisString} size={240} />
          </View>
        )}

        <Text style={styles.tip}>Scan QR menggunakan DANA / OVO / GoPay / ShopeePay</Text>

        {/* Manual Confirm */}
        <TouchableOpacity style={styles.manualBtn} onPress={manualConfirm}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#064e3b" />
          <Text style={styles.manualText}>Konfirmasi Manual</Text>
        </TouchableOpacity>
      </View>

      {/* SUCCESS MODAL */}
      <Modal visible={successVisible} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.successBox}>
            <LottieView ref={lottieRef} autoPlay loop={false} style={{ width: 180, height: 180 }} source={require("../../../assets/animations/lottie-success.json")} />
            <Text style={styles.successText}>Pembayaran Berhasil</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },

  content: { padding: 22, alignItems: "center" },
  amount: { fontSize: 24, fontWeight: "800", color: "#059669" },
  status: { marginTop: 10, color: "#6b7280", fontWeight: "600" },

  qrBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 8,
  },

  tip: {
    marginTop: 14,
    color: "#6b7280",
    textAlign: "center",
    maxWidth: 280,
  },

  manualBtn: {
    marginTop: 18,
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#e7fbe9",
    gap: 8,
    alignItems: "center",
  },
  manualText: { fontWeight: "700", color: "#064e3b" },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  successBox: {
    padding: 28,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
  },
  successText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#059669",
  },
});
