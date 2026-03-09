import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Image, RefreshControl } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, setDoc, addDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function DistribusiStok() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [produk, setProduk] = useState<any[]>([]);
  const [karyawan, setKaryawan] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedKaryawan, setSelectedKaryawan] = useState<string>("");
  const [selectedTanggal, setSelectedTanggal] = useState<any>(null);
  const [jumlah, setJumlah] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      if (usr) {
        setUser(usr);
        fetchData(usr.uid);
      }
    });
    return unsubscribe;
  }, []);

  const fetchData = async (uid: string) => {
    try {
      const produkSnap = await getDocs(collection(db, `users/${uid}/products`));
      const karyawanSnap = await getDocs(collection(db, `users/${uid}/employees`));

      const produkData = [];
      for (const docSnap of produkSnap.docs) {
        const p = { id: docSnap.id, ...docSnap.data() };
        const historySnap = await getDocs(collection(db, `users/${uid}/products/${docSnap.id}/stok_history`));
        const history = historySnap.docs.map((h) => ({
          id: h.id,
          ...h.data(),
        }));
        const totalStok = history.reduce((acc, item: any) => acc + (item.jumlah || 0), 0);
        // 🔥 tambahin pendingAdd default
        produkData.push({ ...p, totalStok, history, pendingAdd: 0 });
      }

      setProduk(produkData);
      setKaryawan(karyawanSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error("Gagal ambil data:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDistribusi = async () => {
    if (!selectedProduct || !selectedKaryawan || !jumlah || !selectedTanggal || !user) {
      Alert.alert("Error", "Semua field wajib diisi");
      return;
    }

    const jml = parseInt(jumlah);
    if (isNaN(jml) || jml <= 0) {
      Alert.alert("Error", "Jumlah harus berupa angka positif");
      return;
    }

    if (selectedTanggal.jumlah < jml) {
      Alert.alert("Stok tidak cukup", `Sisa stok hanya ${selectedTanggal.jumlah}`);
      return;
    }

    try {
      setLoading(true);

      const produkRef = doc(db, `users/${user.uid}/products/${selectedProduct.id}/stok_history/${selectedTanggal.id}`);
      const karyawanProdukRef = doc(db, `users/${user.uid}/employees/${selectedKaryawan}/products/${selectedProduct.id}`);

      // update stok pada entry history yang dipilih
      await updateDoc(produkRef, {
        jumlah: selectedTanggal.jumlah - jml,
      });

      // cek stok lama di karyawan
      const karyawanProdukDoc = await getDoc(karyawanProdukRef);
      const stokLama = karyawanProdukDoc.exists() ? karyawanProdukDoc.data()?.stok ?? 0 : 0;
      const pendingAddLama = karyawanProdukDoc.exists() ? karyawanProdukDoc.data()?.pendingAdd ?? 0 : 0;

      // simpan produk di karyawan + pendingAdd
      await setDoc(
        karyawanProdukRef,
        {
          id: selectedProduct.id,
          name: selectedProduct.nama,
          stok: stokLama, // stok karyawan belum bertambah sampai dia konfirmasi
          pendingAdd: pendingAddLama + jml, // stok menunggu konfirmasi
          harga: selectedProduct.harga || 0,
          imageUri: selectedProduct.imageUri || "",
          expiredDate: selectedTanggal.expiredDate || null,
          adminUid: user.uid,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      // catat log distribusi
      await addDoc(collection(db, `users/${user.uid}/distribusi_stok`), {
        produk_id: selectedProduct.id,
        produk_nama: selectedProduct.nama,
        jumlah: jml,
        tanggalId: selectedTanggal.id,
        expiredDate: selectedTanggal.expiredDate || null,
        karyawan_id: selectedKaryawan,
        karyawan_nama: karyawan.find((k) => k.id === selectedKaryawan)?.name ?? "",
        status: "pending", // biar jelas kalau belum dikonfirmasi karyawan
        createdAt: new Date(),
      });

      await fetchData(user.uid);

      Alert.alert("Sukses", "Distribusi stok berhasil, menunggu konfirmasi karyawan");
      setModalVisible(false);
      setSelectedProduct(null);
      setSelectedKaryawan("");
      setSelectedTanggal(null);
      setJumlah("");
    } catch (e: any) {
      console.error("🔥 Gagal distribusi:", e);
      Alert.alert("Gagal", `Distribusi gagal: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredProduk = produk.filter((p) => p.nama?.toLowerCase().includes(search.toLowerCase()));

  const onRefresh = () => {
    if (user) {
      setRefreshing(true);
      fetchData(user.uid);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/stock-management")}>
          <Ionicons name="arrow-back" size={24} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Distribusi Stok</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" style={{ marginHorizontal: 8 }} />
        <TextInput placeholder="Cari produk" style={styles.searchInput} value={search} onChangeText={setSearch} />
      </View>

      {/* List Produk */}
      <FlatList
        data={filteredProduk}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 30, color: "#777" }}>Tidak ada produk</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              setSelectedProduct(item);
              setModalVisible(true);
            }}
          >
            <Image source={{ uri: item.imageUri || "https://via.placeholder.com/80" }} style={styles.image} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardTitle}>{item.nama}</Text>
              <Text style={styles.cardStok}>Total Stok: {item.totalStok}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#bbb" />
          </TouchableOpacity>
        )}
      />

      {/* Modal Distribusi */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedProduct?.nama}</Text>

            {/* Pilih Karyawan */}
            <Text style={styles.modalLabel}>Pilih Karyawan:</Text>
            <FlatList
              data={karyawan}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.dropdownItem, selectedKaryawan === item.id && { backgroundColor: "#FDECEC" }]} onPress={() => setSelectedKaryawan(item.id)}>
                  <Text style={{ color: "#111" }}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ fontSize: 13, color: "#888" }}>Belum ada karyawan</Text>}
            />

            {/* Pilih Tanggal Stok */}
            <Text style={styles.modalLabel}>Pilih Tanggal Stok:</Text>
            <FlatList
              data={selectedProduct?.history || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.dropdownItem, selectedTanggal?.id === item.id && { backgroundColor: "#FDECEC" }]} onPress={() => setSelectedTanggal(item)}>
                  <Text>
                    {item.expiredDate ? `Expired: ${item.expiredDate}` : `Tanggal Input: ${item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString("id-ID") : "-"}`} (Sisa: {item.jumlah})
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ fontSize: 13, color: "#888" }}>Belum ada stok history</Text>}
            />

            {/* Jumlah */}
            <Text style={styles.modalLabel}>Jumlah:</Text>
            <TextInput keyboardType="numeric" value={jumlah} onChangeText={setJumlah} style={styles.input} placeholder="Contoh: 5" />

            <TouchableOpacity style={styles.saveBtn} onPress={handleDistribusi} disabled={loading}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>{loading ? "Menyimpan..." : "Simpan"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.saveBtn, { backgroundColor: "#aaa", marginTop: 8 }]}>
              <Text style={{ color: "#fff" }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#222" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },
  image: { width: 50, height: 50, borderRadius: 8, backgroundColor: "#ddd" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  cardStok: { fontSize: 13, color: "#666", marginTop: 4 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#00000088",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  modalLabel: { marginTop: 12, marginBottom: 4, fontSize: 14, color: "#333" },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#D32F2F",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
});
