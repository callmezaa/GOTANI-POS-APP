import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";

export default function EditStok() {
  const router = useRouter();
  const { productId, productName, stokId, jumlah, expiredDate, supplier } = useLocalSearchParams();
  const [stok, setStok] = useState(Number(jumlah) || 0);
  const [modalKurangi, setModalKurangi] = useState(false);
  const [modalTambah, setModalTambah] = useState(false);
  const [inputJumlah, setInputJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [imageUri, setImageUri] = useState("");

  const user = getAuth().currentUser;

  useEffect(() => {
    if (user) {
      fetchStok();
      fetchProductImage();
    }
  }, [user]);

  const fetchProductImage = async () => {
    if (!user || !productId) return;
    try {
      const productDoc = await getDoc(doc(db, `users/${user.uid}/products/${productId}`));
      if (productDoc.exists() && productDoc.data().imageUri) {
        setImageUri(productDoc.data().imageUri);
      }
    } catch (e) {
      console.log("❌ Gagal ambil gambar:", e);
    }
  };

  const fetchStok = async () => {
    if (!user) return;
    try {
      const stokDoc = await getDoc(doc(db, `users/${user.uid}/products/${productId}/stok_history/${stokId}`));
      if (stokDoc.exists()) setStok(stokDoc.data().jumlah || 0);
    } catch (e) {
      console.error("❌ Gagal ambil stok:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStok();
  }, []);

  const handleKurangi = async () => {
    if (!inputJumlah) return Alert.alert("Error", "Jumlah wajib diisi");
    if (!user) return;

    try {
      const stokRef = doc(db, `users/${user.uid}/products/${productId}/stok_history/${stokId}`);
      await updateDoc(stokRef, { jumlah: increment(-Number(inputJumlah)), alasan: keterangan });

      const produkRef = doc(db, `users/${user.uid}/products/${productId}`);
      await updateDoc(produkRef, { totalStok: increment(-Number(inputJumlah)) });

      setStok((prev) => prev - Number(inputJumlah));
      setModalKurangi(false);
      setInputJumlah("");
      setKeterangan("");
      Alert.alert("Sukses", "Stok berhasil dikurangi");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Terjadi kesalahan";
      Alert.alert("Gagal", errorMessage);
    }
  };

  const handleTambah = async () => {
    if (!inputJumlah) return Alert.alert("Error", "Jumlah wajib diisi");
    if (!user) return;

    try {
      const stokRef = doc(db, `users/${user.uid}/products/${productId}/stok_history/${stokId}`);
      await updateDoc(stokRef, { jumlah: increment(Number(inputJumlah)) });

      const produkRef = doc(db, `users/${user.uid}/products/${productId}`);
      await updateDoc(produkRef, { totalStok: increment(Number(inputJumlah)) });

      setStok((prev) => prev + Number(inputJumlah));
      setModalTambah(false);
      setInputJumlah("");
      Alert.alert("Sukses", "Stok berhasil ditambah");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Terjadi kesalahan";
      Alert.alert("Gagal", errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/stock/detail-stok")}>
          <Ionicons name="arrow-back" size={24} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Stok</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Card Produk */}
      <View style={styles.card}>
        <Image
          source={{
            uri: imageUri || "https://images.unsplash.com/photo-1586201375761-83865001e17d?auto=format&fit=crop&w=400&q=80",
          }}
          style={styles.productImage}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.desc}>Supplier: {supplier || "-"}</Text>
          <Text style={styles.desc}>Expired: {expiredDate || "-"}</Text>
          <Text style={styles.stok}>Sisa Stok: {stok}</Text>
        </View>
      </View>

      {/* Tombol Aksi */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setModalTambah(true)}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.btnText}>Tambah Stok</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: "#6B7280" }]} onPress={() => setModalKurangi(true)}>
        <Ionicons name="remove" size={20} color="#fff" />
        <Text style={styles.btnText}>Kurangi Stok</Text>
      </TouchableOpacity>

      {/* Modal Tambah */}
      <Modal visible={modalTambah} transparent animationType="slide">
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Stok</Text>
            <TextInput placeholder="Masukkan jumlah stok" keyboardType="numeric" value={inputJumlah} onChangeText={setInputJumlah} style={styles.input} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleTambah}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#aaa" }]} onPress={() => setModalTambah(false)}>
              <Text style={{ color: "#fff" }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Kurangi */}
      <Modal visible={modalKurangi} transparent animationType="slide">
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kurangi Stok</Text>
            <TextInput placeholder="Masukkan jumlah stok" keyboardType="numeric" value={inputJumlah} onChangeText={setInputJumlah} style={styles.input} />
            <TextInput placeholder="Keterangan (Rusak, Retur, Kadaluarsa)" value={keterangan} onChangeText={setKeterangan} style={styles.input} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleKurangi}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#aaa" }]} onPress={() => setModalKurangi(false)}>
              <Text style={{ color: "#fff" }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    margin: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: "#f0f0f0",
  },
  productName: { fontSize: 16, fontWeight: "600", color: "#111" },
  desc: { fontSize: 14, color: "#555", marginTop: 4 },
  stok: { fontSize: 16, fontWeight: "bold", color: "#D32F2F", marginTop: 8 },
  addBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: "row",
    backgroundColor: "#D32F2F",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  btnText: { color: "#fff", marginLeft: 8, fontWeight: "600", fontSize: 15 },
  modalWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#D32F2F",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
});
