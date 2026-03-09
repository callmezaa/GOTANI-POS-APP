import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, setDoc, collection, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PembayaranOnlineSuccess() {
  const router = useRouter();
  const { total, diterima, kembalian, items } = useLocalSearchParams();

  const nominalTotal = Number(total) || 0;
  const nominalDiterima = Number(diterima) || 0;
  const nominalKembalian = Number(kembalian) || 0;

  const pesanan = items ? JSON.parse(items as string) : [];

  const tanggal = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const [refreshing, setRefreshing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // ============================
  // 🔥 Kurangi stok karyawan
  // ============================
  const kurangiStokProduk = async (items: any[]) => {
    try {
      const profile = await AsyncStorage.getItem("employeeProfile");
      if (!profile) return;

      const { adminUid, id: employeeId } = JSON.parse(profile);

      for (const item of items) {
        if (!item.id || !item.qty) continue;

        const productRef = doc(db, `users/${adminUid}/employees/${employeeId}/products/${item.id}`);

        await updateDoc(productRef, {
          stok: increment(-item.qty),
          totalStok: increment(-item.qty),
        });

        console.log(`✅ [STOK KARYAWAN] Produk ${item.id} dikurangi ${item.qty}`);
      }
    } catch (err: any) {
      console.error("❌ Error update stok:", err);
    }
  };

  // ============================
  // 🔥 Simpan transaksi Online
  // ============================
  const simpanKeFirestore = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        // ======================
        // ADMIN
        // ======================
        const transaksiRef = doc(collection(db, `users/${user.uid}/transaksi`));

        await setDoc(transaksiRef, {
          total: nominalTotal,
          diterima: nominalDiterima,
          kembalian: nominalKembalian,
          metode: "Online",
          pesanan,
          created_at: serverTimestamp(),
          by: "admin",
        });

        console.log("✅ Transaksi Online disimpan sebagai ADMIN");

        // 🔥 Kurangi stok admin
        for (const item of pesanan) {
          if (!item.id || !item.qty) continue;

          const productRef = doc(db, `users/${user.uid}/products/${item.id}`);

          await updateDoc(productRef, {
            stok: increment(-item.qty),
            totalStok: increment(-item.qty),
          });

          console.log(`✅ [STOK ADMIN] Produk ${item.id} dikurangi ${item.qty}`);
        }
      } else {
        // ======================
        // KARYAWAN
        // ======================
        const profile = await AsyncStorage.getItem("employeeProfile");
        if (!profile) {
          Alert.alert("Gagal", "Data karyawan tidak ditemukan");
          return;
        }

        const { adminUid, id: employeeId } = JSON.parse(profile);

        const transaksiRef = doc(collection(db, `users/${adminUid}/employees/${employeeId}/transaksi`));

        await setDoc(transaksiRef, {
          total: nominalTotal,
          diterima: nominalDiterima,
          kembalian: nominalKembalian,
          metode: "Online",
          pesanan,
          created_at: serverTimestamp(),
          by: "karyawan",
        });

        console.log("✅ Transaksi Online disimpan sebagai KARYAWAN");

        await kurangiStokProduk(pesanan);
      }
    } catch (err: any) {
      Alert.alert("Gagal menyimpan transaksi", err.message);
      console.error("❌ Error simpan:", err);
    }
  };

  // ============================
  // 🔥 Anti duplikat simpan
  // ============================
  useEffect(() => {
    if (!isSaved) {
      simpanKeFirestore();
      setIsSaved(true);
    }
  }, [isSaved]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      simpanKeFirestore();
      setRefreshing(false);
    }, 900);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0284c7"]} />}>
      <View style={styles.header}>
        <Image source={require("../../../assets/check.png")} style={styles.icon} />
        <Text style={styles.title}>Pembayaran Berhasil</Text>
        <Text style={styles.subtitle}>{tanggal}</Text>
      </View>

      <View style={styles.card}>
        <Row label="Metode Pembayaran" value="Online" />
        <Row label="Total Tagihan" value={`Rp${nominalTotal.toLocaleString("id-ID")}`} />
        <Row label="Diterima" value={`Rp${nominalDiterima.toLocaleString("id-ID")}`} />
        <Row label="Kembalian" value={`Rp${nominalKembalian.toLocaleString("id-ID")}`} />
      </View>

      {/* Tombol */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.outlinedButton}
          onPress={() =>
            router.push({
              pathname: "/kirim-struk",
              params: { total, diterima, kembalian, items },
            })
          }
        >
          <Text style={styles.outlinedText}>📤 Kirim Struk</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newTransactionButton} onPress={() => router.replace("/add-transaction")}>
        <Text style={styles.newTransactionText}>+ Transaksi Baru</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={() => router.back()}>
        <Text style={styles.homeText}>🏠 Kembali ke Beranda</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  icon: { width: 100, height: 100, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
  subtitle: { color: "#6B7280", marginBottom: 24, fontSize: 14 },
  card: {
    backgroundColor: "#F9FAFB",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 14,
    elevation: 2,
    gap: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 14, color: "#374151" },
  value: { fontWeight: "bold", fontSize: 14, color: "#111827" },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginHorizontal: 20,
  },
  outlinedButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#0284c7",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  outlinedText: { textAlign: "center", fontWeight: "bold", color: "#0284c7" },
  newTransactionButton: {
    backgroundColor: "#0284c7",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 28,
    marginHorizontal: 20,
  },
  newTransactionText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  homeButton: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: "#f3f4f6",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  homeText: {
    textAlign: "center",
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },
});
