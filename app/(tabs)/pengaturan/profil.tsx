import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Alert, Modal, Pressable, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { getAuth, updateProfile } from "firebase/auth";
import emitter from "../../../lib/event"; // pastikan path sesuai

export default function PengaturanProfil() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [image, setImage] = useState<string | null>(user?.photoURL || null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const pickImage = async (source: "camera" | "gallery") => {
    const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      return Alert.alert("Izin ditolak", "Aplikasi membutuhkan akses.");
    }

    const result = source === "camera" ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 }) : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      if (user) {
        await updateProfile(user, {
          displayName: name,
          photoURL: image || null,
        });

        emitter.emit("profile-updated");

        Alert.alert("Berhasil", "Profil diperbarui.");
        router.back();
      }
    } catch (error) {
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan.");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // simulasi reload data user
    setTimeout(() => {
      setName(user?.displayName || "");
      setImage(user?.photoURL || null);
      setRefreshing(false);
    }, 800);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/settings")}>
          <Ionicons name="arrow-back" size={24} color="#DC2626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan Profil</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#000"]} />}
        alwaysBounceVertical
        bounces
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Foto Profil */}
        <View style={styles.profileRow}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            {image ? (
              <Image source={{ uri: image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.label}>Nama</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Masukkan nama" placeholderTextColor="#9CA3AF" />
          </View>
        </View>

        {/* Tombol ambil foto */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.outlineButton} onPress={() => pickImage("camera")}>
            <Ionicons name="camera" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.outlineButtonText}>Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={() => pickImage("gallery")}>
            <Ionicons name="image" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.outlineButtonText}>Galeri</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Simpan</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Preview Foto */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          {image && <Image source={{ uri: image }} style={styles.modalImage} resizeMode="contain" />}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#E5E7EB" },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontWeight: "bold", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#111827",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  outlineButton: {
    flex: 1,
    borderColor: "#D32F2F",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  outlineButtonText: { color: "#D32F2F", fontWeight: "600" },
  saveButton: {
    marginTop: 28,
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: "90%", height: "70%", borderRadius: 12 },
});
