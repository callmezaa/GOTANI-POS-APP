import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

type Product = {
  id: string;
  name: string;
  imageUri?: string;
  totalStok: number;
};

export default function KelolaStokScreen() {
  const router = useRouter();
  const user = getAuth().currentUser;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      /* 🔥 HANYA PRODUK AKTIF */
      const productQuery = query(collection(db, `users/${user.uid}/products`), where("isActive", "==", true));

      const productSnap = await getDocs(productQuery);
      const results: Product[] = [];

      for (const docSnap of productSnap.docs) {
        const productData = docSnap.data();

        const historySnap = await getDocs(collection(db, `users/${user.uid}/products/${docSnap.id}/stok_history`));

        const totalStok = historySnap.docs.reduce((acc, h) => acc + (h.data().jumlah || 0), 0);

        results.push({
          id: docSnap.id,
          name: productData.name,
          imageUri: productData.imageUri,
          totalStok,
        });
      }

      setProducts(results);
    } catch (error) {
      console.error("❌ Gagal mengambil data stok:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.title}>Kelola Stok</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D32F2F" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={52} color="#bbb" />
          <Text style={styles.emptyText}>Belum ada produk aktif</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/stock/detail-stok",
                  params: {
                    productId: item.id,
                    productName: item.name,
                  },
                })
              }
            >
              <Image
                source={{
                  uri: item.imageUri || "https://images.unsplash.com/photo-1606813908553-1b8c8a0b7340?auto=format&fit=crop&w=200&q=80",
                }}
                style={styles.image}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.desc}>Total Stok: {item.totalStok}</Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#D32F2F" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f1f1",
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#f3f3f3",
    marginRight: 14,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  desc: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    marginTop: 10,
    fontSize: 14,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
