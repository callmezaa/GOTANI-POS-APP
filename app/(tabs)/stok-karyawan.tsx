// app/stok-karyawan.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

interface Employee {
  id: string;
  name: string;
  email?: string;
  imageUri?: string;
}

export default function StokKaryawan() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        // Admin login → ambil semua karyawan
        setIsAdmin(true);
        const snap = await getDocs(collection(db, `users/${currentUser.uid}/employees`));
        const result = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || data.nama || "Tanpa Nama",
            email: data.email || "-",
            imageUri: data.photoUrl || data.imageUri || data.photoURL || data.profileImage || null, // fallback field
          };
        });
        setEmployees(result);
      } else {
        // Karyawan login → cek di AsyncStorage
        const stored = await AsyncStorage.getItem("employeeProfile");
        if (stored) {
          const profile = JSON.parse(stored);
          setIsAdmin(false);
          router.replace({
            pathname: "/stok-karyawan-detail",
            params: { empId: profile.id, adminUid: profile.adminUid },
          });
          return;
        }
      }
    } catch (e) {
      console.error("❌ Error ambil karyawan:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  const renderItem = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/stok-karyawan-detail",
          params: { empId: item.id },
        })
      }
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#555" }}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  if (isAdmin && employees.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Belum ada karyawan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daftar Karyawan</Text>
        <View style={{ width: 22 }} />
      </View>

      {isAdmin && (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#000"]} />}
          alwaysBounceVertical
          bounces
          overScrollMode="always"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#eee" },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 15, fontWeight: "600", color: "#111" },
  email: { fontSize: 12, color: "#666" },
  emptyText: { fontSize: 14, color: "#666" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
