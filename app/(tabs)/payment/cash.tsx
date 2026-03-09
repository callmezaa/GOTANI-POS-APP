import React, { useState, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet, Modal, Image, ScrollView, RefreshControl, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, doc, setDoc, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PembayaranTunai() {
  const router = useRouter();
  const { total, items } = useLocalSearchParams();
  const nominalTotal = Number(total) || 0;

  const pesanan = useMemo(() => {
    try {
      return items ? JSON.parse(items as string) : [];
    } catch {
      return [];
    }
  }, [items]);

  const [amountPaid, setAmountPaid] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animasi smooth fade-in
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const fetchInfo = async () => {
      const user = getAuth().currentUser;

      if (user) {
        setAdminUid(user.uid);
      } else {
        const storedProfile = await AsyncStorage.getItem("employeeProfile");
        const parsed = storedProfile ? JSON.parse(storedProfile) : null;

        if (parsed && parsed.adminUid && parsed.id) {
          setAdminUid(parsed.adminUid);
          setEmployeeId(parsed.id);
        } else {
          Alert.alert("Gagal", "Tidak dapat menemukan data admin atau karyawan.");
        }
      }
    };
    fetchInfo();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleConfirm = () => {
    const paid = Number(amountPaid);
    if (isNaN(paid) || paid <= 0) {
      return Alert.alert("Masukkan jumlah pembayaran");
    }
    if (paid < nominalTotal) {
      return Alert.alert("Uang tidak cukup", `Total harus Rp${nominalTotal.toLocaleString("id-ID")}`);
    }
    if (!adminUid) {
      return Alert.alert("Gagal", "Pengguna belum login.");
    }
    setShowModal(true);
  };

  const handleFinalConfirm = async () => {
    const paid = Number(amountPaid);
    const kembalian = paid - nominalTotal;

    const transaksiData = {
      total: nominalTotal,
      diterima: paid,
      kembalian,
      metode: "Tunai",
      items: pesanan,
      created_at: serverTimestamp(),
      adminUid: adminUid,
    };

    try {
      let transaksiRef;

      if (employeeId) {
        transaksiRef = doc(collection(db, `users/${adminUid}/employees/${employeeId}/transaksi`));
      } else {
        transaksiRef = doc(collection(db, `users/${adminUid}/transaksi`));
      }

      await setDoc(transaksiRef, transaksiData);
    } catch (err) {
      console.error(err);
      return Alert.alert("Gagal menyimpan transaksi.");
    }

    try {
      for (const item of pesanan) {
        const adminProductRef = doc(db, `users/${adminUid}/products/${item.id}`);
        const adminSnap = await getDoc(adminProductRef);

        if (adminSnap.exists()) {
          const stock = adminSnap.data()?.stok || 0;
          const newStock = Math.max(0, stock - item.qty);
          await updateDoc(adminProductRef, { stok: newStock });
        }

        if (employeeId) {
          const empRef = doc(db, `users/${adminUid}/employees/${employeeId}/products/${item.id}`);
          const empSnap = await getDoc(empRef);
          if (empSnap.exists()) {
            const current = empSnap.data().stok || 0;
            const next = current - item.qty;
            await setDoc(empRef, { stok: next }, { merge: true });
          }
        }
      }
    } catch (err) {
      console.warn("Stok karyawan tidak ditemukan:", err);
    }

    setShowModal(false);

    router.replace({
      pathname: "/transaksi-berhasil",
      params: {
        total: nominalTotal.toString(),
        diterima: paid.toString(),
        kembalian: kembalian.toString(),
        items: JSON.stringify(pesanan),
      },
    });
  };

  const handleExact = () => setAmountPaid(nominalTotal.toString());

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* HEADER PREMIUM */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/pembayaran")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#D32F2F" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pembayaran Tunai</Text>

        <View style={{ width: 22 }} />
      </View>

      {/* MAIN CONTENT */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />} showsVerticalScrollIndicator={false}>
        {/* Total box */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Bayar</Text>
          <Text style={styles.totalAmount}>Rp{nominalTotal.toLocaleString("id-ID")}</Text>
        </View>

        {/* Input uang */}
        <Text style={styles.inputLabel}>Jumlah Uang Diterima</Text>
        <TextInput keyboardType="numeric" value={amountPaid} onChangeText={setAmountPaid} placeholder="Misal: 50.000" style={styles.input} />

        {/* Preview kembalian */}
        {amountPaid !== "" && (
          <View style={styles.previewBox}>
            {Number(amountPaid) < nominalTotal ? <Text style={styles.warningText}>⚠️ Uang tidak cukup</Text> : <Text style={styles.changeText}>Kembalian: Rp{(Number(amountPaid) - nominalTotal).toLocaleString("id-ID")}</Text>}
          </View>
        )}

        {/* Uang pas */}
        <TouchableOpacity style={styles.exactButton} onPress={handleExact}>
          <Text style={styles.exactText}>Uang Pas</Text>
        </TouchableOpacity>

        {/* Shortcut nominal */}
        <Text style={styles.inputLabel}>Pilih Nominal Cepat</Text>
        <View style={styles.shortcutRow}>
          {[20000, 50000, 100000].map((v) => (
            <TouchableOpacity key={v} style={styles.shortcutBtn} onPress={() => setAmountPaid(v.toString())}>
              <Text style={styles.shortcutText}>Rp{v.toLocaleString("id-ID")}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Button konfirmasi */}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Konfirmasi Pembayaran</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL PREMIUM */}
      <Modal visible={showModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image source={require("../../../assets/payment-success.png")} style={{ width: 110, height: 110, marginBottom: 16 }} resizeMode="contain" />

            <Text style={styles.modalTitle}>Pembayaran Rp{nominalTotal.toLocaleString("id-ID")}</Text>
            <Text style={styles.modalSub}>Tetapkan transaksi ini sebagai pembayaran tunai?</Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleFinalConfirm} style={styles.okBtn}>
                <Text style={styles.okText}>Konfirmasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    backgroundColor: "white",
    elevation: 3,
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginLeft: 6,
  },

  /* TOTAL */
  totalBox: {
    backgroundColor: "#FFF4F4",
    padding: 20,
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, color: "#B91C1C", marginBottom: 6 },
  totalAmount: { fontSize: 26, color: "#D32F2F", fontWeight: "bold" },

  /* INPUT */
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 16,
    marginBottom: 6,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
    marginHorizontal: 16,
    marginBottom: 14,
  },

  previewBox: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  warningText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
  changeText: { color: "#10B981", fontWeight: "700", fontSize: 15 },

  exactButton: {
    backgroundColor: "#10b981",
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  exactText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  shortcutRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 26,
    marginHorizontal: 16,
  },
  shortcutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    elevation: 1,
  },
  shortcutText: { fontWeight: "700", fontSize: 14, color: "#374151" },

  confirmButton: {
    marginHorizontal: 16,
    backgroundColor: "#D32F2F",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  confirmText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 26,
    borderRadius: 20,
    alignItems: "center",
    elevation: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
  modalSub: { fontSize: 14, color: "#6b7280", marginTop: 8, textAlign: "center" },

  modalBtnRow: { flexDirection: "row", width: "100%", marginTop: 26, gap: 10 },

  cancelBtn: {
    flex: 1,
    borderWidth: 1.6,
    borderColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelText: {
    color: "#D32F2F",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },

  okBtn: {
    flex: 1,
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 12,
  },
  okText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
});
