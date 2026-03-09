import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, ScrollView, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function DetailStok() {
  const router = useRouter();
  const { productId, productName } = useLocalSearchParams();
  type StokHistoryItem = {
    id: string;
    jumlah?: number;
    supplier?: string;
    expiredDate?: string;
    hargaModal?: number;
    hargaJual?: number;
    createdAt?: any;
    [key: string]: any;
  };

  const [stokHistory, setStokHistory] = useState<StokHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [supplier, setSupplier] = useState("");
  const [suppliers, setSuppliers] = useState<{ id: string; nama?: string }[]>([]);
  const [jumlah, setJumlah] = useState("");
  const [expired, setExpired] = useState("");
  const [hargaModal, setHargaModal] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [imageUri, setImageUri] = useState("");

  const user = getAuth().currentUser;

  useEffect(() => {
    if (user) {
      fetchProductImage();
      fetchHistory();
      fetchSuppliers();
    }
  }, [user]);

  const fetchProductImage = async () => {
    if (!user || !productId) return;
    const snap = await getDocs(collection(db, `users/${user.uid}/products`));
    const product = snap.docs.map((d) => ({ id: d.id, ...(d.data() as { imageUri?: string }) })).find((p) => p.id === productId);
    if (product?.imageUri) setImageUri(product.imageUri);
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, `users/${user.uid}/products/${productId}/stok_history`));
      const data = snap.docs.map((doc) => {
        const { id: _, ...rest } = doc.data() as StokHistoryItem;
        return { id: doc.id, ...rest };
      });
      setStokHistory(data);
      const sum = data.reduce((acc, item) => acc + (item.jumlah || 0), 0);
      setTotal(sum);
    } catch (e) {
      console.error("❌ Gagal ambil history:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSuppliers = async () => {
    if (!user) return;
    const snap = await getDocs(collection(db, `users/${user.uid}/suppliers`));
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSuppliers(data);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const tambahStok = async () => {
    if (!jumlah || !supplier || !hargaModal || !hargaJual) {
      Alert.alert("Error", "Semua field wajib diisi");
      return;
    }
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/products/${productId}/stok_history`), {
        supplier,
        jumlah: Number(jumlah),
        expiredDate: expired || null,
        hargaModal: Number(hargaModal),
        hargaJual: Number(hargaJual),
        createdAt: serverTimestamp(),
      });

      const productRef = doc(db, `users/${user.uid}/products/${productId}`);
      await updateDoc(productRef, {
        totalStok: increment(Number(jumlah)),
      });

      fetchHistory();
      setModalVisible(false);
      setJumlah("");
      setSupplier("");
      setExpired("");
      setHargaModal("");
      setHargaJual("");
      Alert.alert("Sukses", "Stok berhasil ditambahkan");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Terjadi kesalahan";
      Alert.alert("Gagal", errorMessage);
    }
  };

  const formatDate = (timestamp: string | number | Date) => {
    if (!timestamp) return "-";
    let date: Date;
    // Check if it's a Firestore Timestamp object
    if (typeof timestamp === "object" && timestamp !== null && typeof (timestamp as any).toDate === "function") {
      date = (timestamp as any).toDate();
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}{" "}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/stock/kelola")}>
          {" "}
          <Ionicons name="arrow-back" size={24} color="#D32F2F" />{" "}
        </TouchableOpacity>{" "}
        <Text style={styles.headerTitle}>Detail Stok</Text>
        <View style={{ width: 24 }} />{" "}
      </View>
      {/* Gambar Produk */}
      <View style={styles.productCard}>
        <Image
          source={{
            uri: imageUri || "https://images.unsplash.com/photo-1576402187878-974f6b4b17b8?auto=format&fit=crop&w=300&q=80",
          }}
          style={styles.productImage}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.totalText}>Total Stok: {total}</Text>
        </View>
      </View>
      {/* List history stok */}
      <FlatList
        data={stokHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/stock/edit-stok",
                params: {
                  productId,
                  productName,
                  stokId: item.id,
                  jumlah: item.jumlah,
                  expiredDate: item.expiredDate || "",
                  supplier: item.supplier || "",
                },
              })
            }
          >
            <View>
              <Text style={styles.date}>Input: {formatDate(item.createdAt)}</Text>
              <Text style={styles.date}>Expired: {item.expiredDate || "-"}</Text>
              <Text style={styles.supplier}>Supplier: {item.supplier}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.jumlah}>+{item.jumlah}</Text>
              <Text style={styles.price}>Modal: Rp{item.hargaModal?.toLocaleString("id-ID")}</Text>
              <Text style={styles.price}>Jual: Rp{item.hargaJual?.toLocaleString("id-ID")}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888", marginTop: 30 }}>Belum ada history stok</Text>}
      />
      {/* Button tambah stok */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 6 }}>Tambah Stok</Text>
      </TouchableOpacity>
      {/* Modal Tambah Stok */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalWrapper}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Tambah Stok</Text>

            {/* Dropdown supplier */}
            <View style={styles.dropdown}>
              <Text style={styles.dropdownLabel}>Pilih Supplier</Text>
              {suppliers.map((s) => (
                <TouchableOpacity key={s.id} style={[styles.dropdownItem, supplier === s.nama && { backgroundColor: "#fdeaea" }]} onPress={() => s.nama && setSupplier(s.nama)}>
                  <Text style={{ fontSize: 14, color: "#333" }}>{s.nama}</Text>
                </TouchableOpacity>
              ))}
              {suppliers.length === 0 && <Text style={{ fontSize: 13, color: "#888" }}>Belum ada supplier</Text>}
            </View>

            {/* Input jumlah stok */}
            <View style={styles.stepperBox}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setJumlah((prev) => String(Math.max(0, Number(prev) - 1)))}>
                <Ionicons name="remove" size={20} color="#D32F2F" />
              </TouchableOpacity>
              <TextInput style={styles.stepperInput} keyboardType="numeric" value={jumlah} onChangeText={setJumlah} />
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setJumlah((prev) => String(Number(prev || 0) + 1))}>
                <Ionicons name="add" size={20} color="#D32F2F" />
              </TouchableOpacity>
            </View>

            {/* Input tanggal expired */}
            <View style={styles.dateBox}>
              <Text style={styles.dropdownLabel}>Tanggal Expired</Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: expired ? "#111" : "#888" }}>
                  {expired
                    ? new Date(expired).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Pilih Tanggal"}
                </Text>
                <Ionicons name="calendar" size={18} color="#D32F2F" />
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={expired ? new Date(expired) : new Date()}
                mode="date"
                display="calendar"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setExpired(selectedDate.toISOString().split("T")[0]);
                  }
                }}
              />
            )}

            {/* Input Harga Modal */}
            <Text style={styles.dropdownLabel}>Harga Modal</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={hargaModal ? `Rp ${Number(hargaModal).toLocaleString("id-ID")}` : ""}
              onChangeText={(val) => {
                const numeric = val.replace(/[^0-9]/g, "");
                setHargaModal(numeric);
              }}
              placeholder="Masukkan harga modal"
            />

            {/* Input Harga Jual */}
            <Text style={styles.dropdownLabel}>Harga Jual</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={hargaJual ? `Rp ${Number(hargaJual).toLocaleString("id-ID")}` : ""}
              onChangeText={(val) => {
                const numeric = val.replace(/[^0-9]/g, "");
                setHargaJual(numeric);
              }}
              placeholder="Masukkan harga jual"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={tambahStok}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#aaa" }]} onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#fff" }}>Batal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
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

  productCard: {
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
  totalText: { fontSize: 14, color: "#D32F2F", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  date: { fontSize: 13, color: "#333" },
  supplier: { fontSize: 13, color: "#555", marginTop: 2 },
  jumlah: { fontSize: 16, fontWeight: "bold", color: "#111" },
  price: { fontSize: 13, color: "#666", marginTop: 2 },

  addButton: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#D32F2F",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },

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
    maxHeight: "85%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  dropdownLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#444" },
  dropdownItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    fontSize: 14,
  },
  stepperBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 14,
    overflow: "hidden",
  },
  stepperBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fdeaea",
    justifyContent: "center",
    alignItems: "center",
  },
  stepperInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    color: "#111",
  },
  dateBox: { marginBottom: 14 },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  saveBtn: {
    backgroundColor: "#D32F2F",
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
  },
});
