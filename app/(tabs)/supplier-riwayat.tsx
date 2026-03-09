import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, RefreshControl, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";

export default function SupplierRiwayat() {
  const router = useRouter();
  const { supplierId } = useLocalSearchParams();
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRiwayat = async () => {
    try {
      setLoading(true);
      const user = getAuth().currentUser;
      if (!user || !supplierId) return;

      const q = query(collection(db, `users/${user.uid}/suppliers/${supplierId}/riwayat`), orderBy("tanggal", "desc"));
      const snap = await getDocs(q);

      const result = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          productName: data.productName ?? "Tanpa Nama",
          jumlah: data.jumlah ?? 0,
          imageUri: data.imageUri ?? null,
          tanggal: data.tanggal?.toDate ? data.tanggal.toDate() : new Date(),
        };
      });

      setRiwayat(result);
    } catch (e) {
      console.error("❌ Gagal ambil riwayat:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.image} />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={{ fontSize: 18 }}>📦</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.product}>{item.productName}</Text>
        <Text style={styles.detail}>
          Jumlah masuk: <Text style={styles.jumlah}>{item.jumlah}</Text>
        </Text>
        <Text style={styles.date}>{formatDate(item.tanggal)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/stock/supplier")}>
          <Ionicons name="arrow-back" size={22} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Supplier</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={riwayat}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={riwayat.length === 0 ? styles.emptyContainer : { padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchRiwayat} colors={["#000"]} />}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Ionicons name="file-tray-outline" size={50} color="#bbb" />
              <Text style={styles.emptyText}>Belum ada riwayat supply</Text>
            </View>
          }
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  product: { fontSize: 15, fontWeight: "600", color: "#111" },
  detail: { fontSize: 13, color: "#444", marginTop: 2 },
  jumlah: { fontWeight: "bold", color: "#D32F2F" },
  date: { fontSize: 12, color: "#777", marginTop: 4, fontStyle: "italic" },
  emptyWrapper: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { fontSize: 14, color: "#666", marginTop: 8 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
});
