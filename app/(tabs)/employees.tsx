import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, FlatList, Alert, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface Employee {
  id: string;
  name: string;
  username: string;
  role: string;
  photoUrl?: string;
}

export default function EmployeePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const auth = getAuth();
  const user = auth.currentUser;

  const fetchEmployees = async () => {
    if (!user) return;
    try {
      const snapshot = await getDocs(collection(db, `users/${user.uid}/employees`));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      Alert.alert("Error", "Gagal memuat ulang data.");
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!user) return;

    const q = collection(db, `users/${user.uid}/employees`);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];
        setEmployees(data);
        setFilteredEmployees(data);
        setLoading(false);
      },
      (error) => {
        Alert.alert("Gagal", "Tidak dapat memuat data karyawan");
        console.error(error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Konfirmasi", `Yakin ingin menghapus "${name}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Ya, Hapus",
        onPress: () => {
          Alert.alert("Yakin?", "Tindakan ini tidak bisa dibatalkan", [
            { text: "Batal", style: "cancel" },
            {
              text: "Hapus Sekarang",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteDoc(doc(db, `users/${user?.uid}/employees`, id));
                } catch (error) {
                  Alert.alert("Error", "Gagal menghapus karyawan");
                  console.error(error);
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const keyword = text.toLowerCase();
    const filtered = employees.filter((item) => item.name.toLowerCase().includes(keyword) || item.username.toLowerCase().includes(keyword));
    setFilteredEmployees(filtered);
  };

  const renderItem = ({ item }: { item: Employee }) => (
    <View style={styles.card}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Ionicons name="person" size={26} color="#bbb" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.role}>{item.role === "kasir" ? "Staff Kasir" : item.role}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.push(`/karyawan/edit-employees?id=${item.id}`)} style={styles.iconBtn}>
          <Feather name="edit-2" size={18} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.iconBtn}>
          <Feather name="trash-2" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Karyawan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#000"]} />}
        alwaysBounceVertical
        bounces
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput placeholder="Cari nama atau username" placeholderTextColor="#999" value={search} onChangeText={handleSearch} style={styles.searchInput} />
        </View>

        {/* Illustration */}
        <Image source={require("../../assets/employee-guide.png")} style={styles.imageTop} resizeMode="contain" />
        <Text style={styles.description}>Karyawan dapat masuk menggunakan akun yang telah dibuat, dengan Username dan Kata Sandi yang didaftarkan.</Text>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />
        ) : filteredEmployees.length === 0 ? (
          <>
            <Image source={require("../../assets/no-employee.png")} style={styles.imageEmpty} resizeMode="contain" />
            <Text style={styles.emptyText}>Belum ada karyawan</Text>
          </>
        ) : (
          <FlatList data={filteredEmployees} renderItem={renderItem} keyExtractor={(item) => item.id} scrollEnabled={false} contentContainerStyle={{ gap: 14 }} />
        )}
      </ScrollView>

      {/* FAB Add */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/karyawan/add-employees")}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
    borderColor: "#eee",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  searchWrapper: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 44,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: { flex: 1, fontSize: 14, paddingLeft: 10, color: "#111" },
  imageTop: { width: "100%", height: 160 },
  description: {
    textAlign: "center",
    color: "#555",
    fontSize: 14,
    marginVertical: 16,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  imageEmpty: { width: "100%", height: 200, marginBottom: 12 },
  emptyText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
    color: "#444",
    marginBottom: 20,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    backgroundColor: "#D32F2F",
    padding: 16,
    borderRadius: 30,
    elevation: 5,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  name: { fontWeight: "bold", fontSize: 15, color: "#111" },
  username: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  role: { fontSize: 12, color: "#D32F2F", fontWeight: "600", marginTop: 2 },
  actions: { flexDirection: "row", gap: 12 },
  iconBtn: { padding: 6 },
});
