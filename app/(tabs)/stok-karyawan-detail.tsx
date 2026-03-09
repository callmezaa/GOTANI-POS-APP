// app/stok-karyawan-detail.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, RefreshControl, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";

interface Product {
  id: string;
  name: string;
  stock: number;
  imageUri?: string;
  harga?: number;
  expiredDate?: string;
  pendingAdd?: number; // ✅ tambahin ini
}

export default function StokKaryawanDetail() {
  const router = useRouter();
  const { empId, adminUid } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchStok = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const uid = adminUid || currentUser?.uid;

      if (!uid || !empId) return;

      const snap = await getDocs(collection(db, `users/${uid}/employees/${empId}/products`));
      const result = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.nama ?? "Tanpa Nama",
          stock: data.stok ?? 0,
          imageUri: data.imageUri || null,
          harga: data.harga ?? null,
          expiredDate: data.expiredDate ?? null,
          pendingAdd: data.pendingAdd ?? 0, // ✅ ikutkan pendingAdd
        };
      });

      setProducts(result);
    } catch (e) {
      console.error("❌ Gagal ambil stok karyawan:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStok();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStok();
  };
  // Tambahin fungsi konfirmasi

  const handleConfirmAdd = async () => {
    if (!selectedProduct) return;
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const uid = adminUid || currentUser?.uid;
      if (!uid || !empId) return;

      const productRef = doc(db, `users/${uid}/employees/${empId}/products/${selectedProduct.id}`);

      await updateDoc(productRef, {
        stok: (selectedProduct.stock || 0) + (selectedProduct.pendingAdd || 0),
        pendingAdd: 0,
      });

      setSelectedProduct(null);
      fetchStok();
    } catch (e) {
      console.error("❌ Gagal konfirmasi stok:", e);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID");
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedProduct(item)}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.image} />
      ) : (
        <View style={styles.imageFallback}>
          <Text>📦</Text>
        </View>
      )}
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.stock}>Stok: {item.stock}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/stok-karyawan")}>
          <Ionicons name="arrow-back" size={22} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stok Karyawan</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* List Produk */}
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#000"]} />}
          alwaysBounceVertical
          bounces
          overScrollMode="always"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 30, color: "#777" }}>Tidak ada produk</Text>}
        />
      )}

      {/* Modal Detail Produk */}
      <Modal visible={!!selectedProduct} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            {selectedProduct?.imageUri && <Image source={{ uri: selectedProduct.imageUri }} style={styles.modalImage} />}
            <Text style={styles.modalDetail}>Stok: {selectedProduct?.stock}</Text>
            <Text style={styles.modalDetail}>Harga: Rp{selectedProduct?.harga?.toLocaleString("id-ID") ?? "-"}</Text>
            <Text style={styles.modalDetail}>Expired: {formatDate(selectedProduct?.expiredDate)}</Text>

            {/* ✅ Tambah info pendingAdd */}
            {selectedProduct?.pendingAdd ? (
              <>
                <Text style={[styles.modalDetail, { color: "#D32F2F", fontWeight: "600" }]}>Ada tambahan stok: {selectedProduct.pendingAdd}</Text>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAdd}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Terima Stok</Text>
                </TouchableOpacity>
              </>
            ) : null}

            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedProduct(null)}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>Tutup</Text>
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
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#f2f2f2",
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    gap: 12,
  },
  image: { width: 50, height: 50, borderRadius: 8, backgroundColor: "#eee" },
  imageFallback: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#f3f3f3",
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 15, fontWeight: "600", color: "#111" },
  stock: { fontSize: 13, color: "#555" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, color: "#111" },
  modalImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 10 },
  modalDetail: { fontSize: 13, color: "#444", marginBottom: 6 },
  closeButton: {
    marginTop: 12,
    backgroundColor: "#D32F2F",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButton: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
