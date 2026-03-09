import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Modal, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useRouter } from "expo-router";

export default function SupplierScreen() {
  const router = useRouter();
  const user = getAuth().currentUser;

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetailVisible, setModalDetailVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const [newSupplier, setNewSupplier] = useState({
    nama: "",
    kontak: "",
    imageUri: "",
  });

  useEffect(() => {
    if (!user?.uid) return;
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, `users/${user?.uid}/suppliers`), orderBy("createdAt", "desc")));
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSuppliers(data);
    } catch (err) {
      console.error("Gagal ambil supplier:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setNewSupplier((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.nama || !newSupplier.kontak) {
      Alert.alert("Harap lengkapi semua field");
      return;
    }

    try {
      await addDoc(collection(db, `users/${user?.uid}/suppliers`), {
        ...newSupplier,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Sukses", "Supplier berhasil ditambahkan");
      setModalVisible(false);
      setNewSupplier({ nama: "", kontak: "", imageUri: "" });
      fetchSuppliers();
    } catch (error) {
      Alert.alert("Gagal menambahkan supplier");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${user?.uid}/suppliers/${id}`));
      Alert.alert("Sukses", "Supplier berhasil dihapus");
      setModalDetailVisible(false);
      fetchSuppliers();
    } catch (err) {
      Alert.alert("Gagal menghapus supplier");
    }
  };

  const filteredSuppliers = suppliers.filter((sup) => sup.nama?.toLowerCase().includes(search.toLowerCase()));

  const renderSupplier = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedSupplier(item);
        setModalDetailVisible(true);
      }}
    >
      <Image source={item.imageUri ? { uri: item.imageUri } : require("../../../assets/placeholder-image.png")} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.nama}</Text>
        <Text style={styles.kontak}>{item.kontak}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/stock-management")}>
            <Ionicons name="arrow-back" size={24} color="#D32F2F" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Daftar Supplier</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <TextInput style={styles.searchBar} placeholder="Cari supplier..." value={search} onChangeText={setSearch} />

        {/* Supplier List */}
        {loading ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={filteredSuppliers}
            keyExtractor={(item) => item.id}
            renderItem={renderSupplier}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#000"]} />}
            alwaysBounceVertical
            bounces
            overScrollMode="always"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada supplier</Text>}
          />
        )}

        {/* FAB Add */}
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Modal Tambah Supplier */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Tambah Supplier</Text>

              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                {newSupplier.imageUri ? <Image source={{ uri: newSupplier.imageUri }} style={styles.imagePreview} /> : <Ionicons name="camera" size={28} color="#ccc" />}
              </TouchableOpacity>

              <TextInput style={styles.input} placeholder="Nama Supplier" value={newSupplier.nama} onChangeText={(text) => setNewSupplier((prev) => ({ ...prev, nama: text }))} />
              <TextInput style={styles.input} placeholder="Kontak / Telepon" keyboardType="phone-pad" value={newSupplier.kontak} onChangeText={(text) => setNewSupplier((prev) => ({ ...prev, kontak: text }))} />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSupplier}>
                <Text style={styles.saveBtnText}>Simpan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Modal Detail Supplier */}
        <Modal visible={modalDetailVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {selectedSupplier && (
                <>
                  <Image source={selectedSupplier.imageUri ? { uri: selectedSupplier.imageUri } : require("../../../assets/placeholder-image.png")} style={styles.detailAvatar} />
                  <Text style={styles.modalTitle}>{selectedSupplier.nama}</Text>
                  <Text style={{ color: "#6b7280", marginBottom: 16 }}>{selectedSupplier.kontak}</Text>

                  {/* Tombol Riwayat */}
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: "#2563eb" }]}
                    onPress={() => {
                      setModalDetailVisible(false);
                      router.push({
                        pathname: "/supplier-riwayat",
                        params: { supplierId: selectedSupplier.id },
                      });
                    }}
                  >
                    <Text style={styles.saveBtnText}>📜 Lihat Riwayat</Text>
                  </TouchableOpacity>

                  {/* Tombol Edit */}
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => {
                      Alert.alert("Info", "Fitur edit bisa kamu kembangkan 👌");
                    }}
                  >
                    <Text style={styles.saveBtnText}>Edit</Text>
                  </TouchableOpacity>

                  {/* Tombol Hapus */}
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: "#ef4444" }]}
                    onPress={() =>
                      Alert.alert("Hapus Supplier", "Yakin ingin menghapus?", [
                        { text: "Batal", style: "cancel" },
                        {
                          text: "Hapus",
                          style: "destructive",
                          onPress: () => handleDeleteSupplier(selectedSupplier.id),
                        },
                      ])
                    }
                  >
                    <Text style={styles.saveBtnText}>Hapus</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalDetailVisible(false)}>
                    <Text style={styles.cancelBtnText}>Tutup</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  searchBar: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: "#f9fafb",
    fontSize: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  name: { fontSize: 16, fontWeight: "600", color: "#111827" },
  kontak: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 40,
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    backgroundColor: "#D32F2F",
    padding: 16,
    borderRadius: 30,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: "#f3f4f6",
  },
  imagePicker: {
    width: 80,
    height: 80,
    backgroundColor: "#f3f4f6",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  saveBtn: {
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  cancelBtn: {
    marginTop: 10,
  },
  cancelBtnText: {
    color: "#6b7280",
  },
});
