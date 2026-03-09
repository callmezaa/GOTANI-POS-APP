import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView, RefreshControl, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import * as ImagePicker from "expo-image-picker";

const roles = [
  { label: "Kasir", value: "kasir" },
  { label: "Karyawan", value: "karyawan" },
];

export default function EditEmployee() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = getAuth().currentUser;

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("karyawan");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = async () => {
    if (!user || !id) return;
    try {
      const ref = doc(db, `users/${user.uid}/employees/${id}`);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setUsername(data.username || "");
        setPassword(data.password || "");
        setRole(data.role || "karyawan");
        setImageUri(data.photoUrl || null);
      } else {
        Alert.alert("Not Found", "Data tidak ditemukan.");
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", "Gagal mengambil data karyawan.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!name || !username || !password) {
      Alert.alert("Gagal", "Semua field wajib diisi");
      return;
    }

    try {
      const ref = doc(db, `users/${user?.uid}/employees/${id}`);
      await updateDoc(ref, {
        name,
        username,
        password,
        role,
        photoUrl: imageUri || "",
      });

      Alert.alert("Berhasil", "Data karyawan diperbarui");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan perubahan");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />} alwaysBounceVertical overScrollMode="always" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/employees")}>
          <Ionicons name="arrow-back" size={22} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Karyawan</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Nama *</Text>
        <TextInput style={styles.input} placeholder="Nama lengkap" value={name} onChangeText={setName} />

        <Text style={styles.label}>Username *</Text>
        <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />

        <Text style={styles.label}>Password *</Text>
        <View style={styles.passwordWrapper}>
          <TextInput style={styles.input} placeholder="Kata sandi" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#555" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Jabatan *</Text>
        <TouchableOpacity style={styles.roleDropdown} onPress={() => setModalVisible(true)}>
          <Text style={styles.roleText}>{role === "kasir" ? "Kasir" : "Karyawan"}</Text>
          <Ionicons name="chevron-down" size={18} color="#D32F2F" />
        </TouchableOpacity>

        <Text style={styles.label}>Foto Profil</Text>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : <Text style={styles.imageLabel}>Pilih dari Galeri</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
          <Text style={styles.submitText}>Simpan Perubahan</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Role */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Jabatan</Text>
            {roles.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleOption, role === r.value && styles.activeRole]}
                onPress={() => {
                  setRole(r.value);
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.roleLabel, role === r.value && { color: "#D32F2F", fontWeight: "600" }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#666" }}>Batal</Text>
            </TouchableOpacity>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  form: { marginTop: 4 },
  label: {
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
    fontSize: 13,
  },
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
  roleDropdown: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  roleText: { fontSize: 14, color: "#111", fontWeight: "500" },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  previewImage: { width: "100%", height: "100%", borderRadius: 10 },
  imageLabel: { textAlign: "center", color: "#9CA3AF", fontSize: 12 },
  submitButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 15, fontWeight: "600", marginBottom: 12, color: "#111" },
  roleOption: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8 },
  activeRole: { backgroundColor: "#FCECEC" },
  roleLabel: { fontSize: 14, color: "#333" },
  modalCancel: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
  },
});
