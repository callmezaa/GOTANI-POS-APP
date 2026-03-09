import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function KaryawanProfil() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await AsyncStorage.getItem("employeeProfile");
      if (data) {
        setProfile(JSON.parse(data));
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Konfirmasi", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        onPress: async () => {
          await AsyncStorage.removeItem("employeeProfile");
          router.replace("/auth/login");
        },
        style: "destructive",
      },
    ]);
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Memuat data karyawan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={64} color="#D32F2F" />
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        <Text style={styles.role}>{profile.role === "kasir" ? "Staff Kasir" : profile.role}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 30 },
  name: { fontSize: 20, fontWeight: "bold", color: "#000", marginTop: 12 },
  username: { fontSize: 14, color: "#555", marginTop: 4 },
  role: { fontSize: 13, color: "#D32F2F", marginTop: 2, fontWeight: "600" },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    gap: 10,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16, color: "#444" },
});
