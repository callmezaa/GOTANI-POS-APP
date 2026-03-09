import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, Alert, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function PengaturanStruk() {
  const [namaToko, setNamaToko] = useState("");
  const [alamatToko, setAlamatToko] = useState("");
  const [tampilkanLogo, setTampilkanLogo] = useState(true);
  const [tampilkanCatatan, setTampilkanCatatan] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();
  const router = useRouter();

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      const ref = doc(db, `users/${user.uid}/pengaturan`, "struk");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setNamaToko(data.nama_toko || "");
        setAlamatToko(data.alamat_toko || "");
        setTampilkanLogo(data.tampilkan_logo ?? true);
        setTampilkanCatatan(data.tampilkan_catatan ?? true);
      }
    } catch (err) {
      Alert.alert("Error", "Gagal memuat pengaturan.");
      console.error(err);
    } finally {
      setInitializing(false);
      setRefreshing(false);
    }
  };

  const handleSimpan = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const ref = doc(db, `users/${user.uid}/pengaturan`, "struk");
      await setDoc(ref, {
        nama_toko: namaToko,
        alamat_toko: alamatToko,
        tampilkan_logo: tampilkanLogo,
        tampilkan_catatan: tampilkanCatatan,
      });
      Alert.alert("Berhasil", "Pengaturan struk disimpan.");
    } catch (err) {
      Alert.alert("Error", "Gagal menyimpan pengaturan.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#DC2626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan Struk</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DC2626"]} />}
        alwaysBounceVertical
        bounces
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Nama Toko</Text>
        <TextInput style={styles.input} value={namaToko} onChangeText={setNamaToko} placeholder="Contoh: Toko ABC" placeholderTextColor="#9CA3AF" />

        <Text style={styles.label}>Alamat Toko</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={alamatToko} onChangeText={setAlamatToko} multiline placeholder="Contoh: Jl. Raya No.123, Kota" placeholderTextColor="#9CA3AF" />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Tampilkan Logo di Struk</Text>
          <Switch value={tampilkanLogo} onValueChange={setTampilkanLogo} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Tampilkan Catatan Kaki</Text>
          <Switch value={tampilkanCatatan} onValueChange={setTampilkanCatatan} />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSimpan} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? "Menyimpan..." : "Simpan"}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  label: { fontWeight: "600", marginTop: 14, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    backgroundColor: "#F9FAFB",
    fontSize: 14,
    color: "#111827",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 6,
  },
  switchLabel: { color: "#374151", fontSize: 15 },
  saveButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 32,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
