import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Animated, Easing, Modal, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

const roles = [
  {
    label: "Staff Kasir",
    value: "kasir",
    description: ["Melihat daftar produk", "Melakukan penjualan produk", "Melihat riwayat transaksi", "Menginput & melihat Kas Masuk & Keluar"],
  },
  {
    label: "Staff Inventaris",
    value: "inventoris",
    description: ["Mengelola stok produk", "Melakukan input barang masuk/keluar", "Melihat riwayat stok", "Mengecek jumlah minimum stok"],
  },
];

export default function AddEmployee() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [tempRole, setTempRole] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const handlePickImage = async (fromCamera = false) => {
    const result = fromCamera ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 }) : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !username || !password || !selectedRole) {
      Alert.alert("Gagal", "Semua field wajib diisi.");
      return;
    }

    const auth = getAuth();
    const admin = auth.currentUser;

    if (!admin || !admin.uid) {
      Alert.alert("Gagal", "Silakan login sebagai admin terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Simpan data karyawan langsung ke Firestore
      await addDoc(collection(db, `users/${admin.uid}/employees`), {
        name,
        username: username.toLowerCase(),
        password, // ⚠️ untuk production sebaiknya di-hash dulu
        role: selectedRole.value,
        roleLabel: selectedRole.label,
        photoUrl: photo || "",
        adminUid: admin.uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Berhasil", "Karyawan berhasil ditambahkan.");
      router.back();
    } catch (error: any) {
      console.error("❌ Gagal tambah karyawan:", error);
      Alert.alert("Gagal", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRole) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [selectedRole]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setName("");
      setUsername("");
      setPassword("");
      setSelectedRole(null);
      setTempRole(null);
      setPhoto(null);
      setRefreshing(false);
    }, 800);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} alwaysBounceVertical overScrollMode="always" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/employees")}>
          <Ionicons name="arrow-back" size={22} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Karyawan</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Form */}
      <Text style={styles.label}>Nama *</Text>
      <TextInput style={styles.input} placeholder="Contoh: Budi" value={name} onChangeText={setName} />

      <Text style={styles.label}>Username *</Text>
      <TextInput style={styles.input} placeholder="Contoh: budi_kasir" autoCapitalize="none" value={username} onChangeText={setUsername} />

      <Text style={styles.label}>Kata Sandi *</Text>
      <View style={styles.passwordWrapper}>
        <TextInput style={styles.input} placeholder="Masukkan kata sandi" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.photoBox}>{photo ? <Image source={{ uri: photo }} style={styles.photo} /> : <Text style={styles.photoText}>Foto Profil</Text>}</TouchableOpacity>

        <View style={styles.roleBox}>
          <Text style={styles.label}>Jabatan *</Text>
          <TouchableOpacity style={styles.roleDropdown} onPress={() => setModalVisible(true)}>
            <Text style={styles.roleText}>{selectedRole?.label || "Pilih Jabatan"}</Text>
            <Ionicons name={modalVisible ? "chevron-up" : "chevron-down"} size={18} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.imageButtons}>
        <TouchableOpacity style={styles.imageBtn} onPress={() => handlePickImage(true)}>
          <Text style={styles.imageBtnText}>Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.imageBtn} onPress={() => handlePickImage(false)}>
          <Text style={styles.imageBtnText}>Galeri</Text>
        </TouchableOpacity>
      </View>

      {/* Deskripsi */}
      {selectedRole && (
        <Animated.View
          style={{
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
            opacity: slideAnim,
            marginBottom: 20,
          }}
        >
          <Text style={styles.descTitle}>Deskripsi Jabatan {selectedRole.label}</Text>
          {selectedRole.description.map((item: string, index: number) => (
            <Text key={index} style={styles.descItem}>
              • {item}
            </Text>
          ))}
        </Animated.View>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Simpan</Text>}
      </TouchableOpacity>

      {/* Modal Jabatan */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            {roles.map((role, index) => (
              <TouchableOpacity key={index} style={[styles.roleOption, tempRole?.value === role.value && styles.activeRole]} onPress={() => setTempRole(role)}>
                <Text style={[styles.roleLabel, tempRole?.value === role.value && { color: "#D32F2F", fontWeight: "600" }]}>{role.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnOutline} onPress={() => setModalVisible(false)}>
                <Text style={{ color: "#D32F2F", fontWeight: "600" }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => {
                  setSelectedRole(tempRole);
                  setModalVisible(false);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Pilih</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  label: { fontWeight: "500", color: "#333", marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 14,
    color: "#111",
  },
  passwordWrapper: { position: "relative", marginBottom: 14 },
  eyeIcon: { position: "absolute", right: 12, top: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, gap: 10 },
  photoBox: {
    backgroundColor: "#F9FAFB",
    flex: 1,
    height: 70,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  photo: { width: "100%", height: "100%", borderRadius: 10 },
  photoText: { color: "#9CA3AF", fontSize: 12 },
  roleBox: { flex: 1 },
  roleDropdown: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleText: { fontWeight: "500", color: "#111", fontSize: 14 },
  imageButtons: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, gap: 10 },
  imageBtn: {
    borderWidth: 1.2,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderColor: "#D32F2F",
  },
  imageBtnText: { color: "#D32F2F", fontSize: 13, fontWeight: "500" },
  descTitle: { fontWeight: "600", fontSize: 14, marginBottom: 8, color: "#222" },
  descItem: { fontSize: 13, color: "#555", marginBottom: 4 },
  submitButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  modalWrapper: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  roleOption: { paddingVertical: 12, borderRadius: 8 },
  activeRole: { backgroundColor: "#FEF2F2" },
  roleLabel: { fontSize: 14, color: "#333" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 10 },
  modalBtnOutline: {
    borderWidth: 1.2,
    borderColor: "#D32F2F",
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  modalBtn: {
    backgroundColor: "#D32F2F",
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
});
