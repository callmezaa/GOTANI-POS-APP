import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import LottieView from "lottie-react-native";
import { RoleGuard } from "../../components/RoleGuard";

export default function ProductPage() {
  const router = useRouter();
  const user = getAuth().currentUser;

  const [tab, setTab] = useState<"produk" | "kategori">("produk");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;

    console.log("UID:", user.uid);

    // =============================
    // PRODUCTS (NO ORDER BY)
    // =============================
    const unsubProducts = onSnapshot(collection(db, `users/${user.uid}/products`), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("PRODUCTS:", data);
      setProducts(data);
    });

    // =============================
    // CATEGORIES
    // =============================
    const unsubCategories = onSnapshot(collection(db, `users/${user.uid}/categories`), (snap) => {
      setCategories(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, [user]);

  const filteredProducts = products.filter((item) => item.nama?.toLowerCase().includes(search.toLowerCase()) || item.kategori?.toLowerCase().includes(search.toLowerCase()));

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#D32F2F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kelola Produk</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* TAB */}
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setTab("produk")} style={styles.tabItem}>
            <Text style={[styles.tabText, tab === "produk" && styles.tabActive]}>Produk</Text>
            {tab === "produk" && <View style={styles.tabUnderline} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setTab("kategori")} style={styles.tabItem}>
            <Text style={[styles.tabText, tab === "kategori" && styles.tabActive]}>Kategori</Text>
            {tab === "kategori" && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        {tab === "produk" && (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput placeholder="Cari produk atau kategori" value={search} onChangeText={setSearch} style={styles.searchInput} />
          </View>
        )}

        {/* LIST */}
        {tab === "produk" ? (
          filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.productCard} onPress={() => router.push(`/EditProductForm?id=${item.id}`)}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.productImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.nama}</Text>
                    <Text style={styles.productCategory}>{item.kategori}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <LottieView source={require("../../assets/animations/empty-box.json")} autoPlay loop style={{ width: 180, height: 180 }} />
              <Text style={styles.emptyText}>Belum ada produk</Text>
            </View>
          )
        ) : (
          <ScrollView contentContainerStyle={styles.categoryContainer}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.categoryItem}>
                <Ionicons name="folder-outline" size={20} color="#6B7280" />
                <Text style={styles.categoryText}>{cat.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => tab === "produk" && router.push("/AddProductForm")}>
          <LinearGradient colors={["#D32F2F", "#B91C1C"]} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#EEE",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  tabItem: {
    marginHorizontal: 28,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    color: "#9CA3AF",
  },
  tabActive: {
    color: "#D32F2F",
    fontWeight: "600",
  },
  tabUnderline: {
    height: 3,
    width: 36,
    borderRadius: 2,
    backgroundColor: "#D32F2F",
    marginTop: 6,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EEE",
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#111",
  },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F1F1",
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 14,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  productCategory: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: "#9CA3AF",
  },

  categoryContainer: {
    padding: 20,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    gap: 12,
  },
  categoryText: {
    fontSize: 15,
    color: "#111",
    fontWeight: "500",
  },

  fab: {
    position: "absolute",
    right: 24,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 30,
    elevation: 5,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
