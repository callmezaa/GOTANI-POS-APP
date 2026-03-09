// ...IMPORT
import { View, Text, Image, TouchableOpacity, TextInput, FlatList, Alert, StyleSheet, Platform, UIManager, LayoutAnimation, RefreshControl, LogBox } from "react-native";
import { useState, useEffect, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useRouter } from "expo-router";
import { Modalize } from "react-native-modalize";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Abaikan warning SyntheticEvent Modalize
LogBox.ignoreLogs(["This synthetic event is reused for performance reasons"]);

// ...TYPING
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUri?: string;
  category?: string;
}

interface CartItem extends Product {
  qty: number;
}

// ENABLE LayoutAnimation (Android)
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AddTransaction() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const router = useRouter();
  const modalRef = useRef<Modalize>(null);
  const auth = getAuth();

  // ⏳ Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  // 🚀 Fetch product & kategori
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const fetch = async () => {
      const stored = await AsyncStorage.getItem("employeeProfile");

      if (stored) {
        // 👷 Karyawan
        const { adminUid, id: karyawanUid } = JSON.parse(stored);
        const path = collection(db, `users/${adminUid}/employees/${karyawanUid}/products`);
        unsubscribe = onSnapshot(path, (snap) => {
          const data = snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              name: d.nama ?? "-",
              price: d.harga_jual ?? 0,
              stock: d.totalStok ?? d.stok ?? 0,
              imageUri: d.imageUri ?? "",
              category: d.kategori ?? "-",
            };
          });

          setProducts(data);
          setCategories([...new Set(data.map((d) => d.category ?? "-"))]);
        });
      } else if (user?.uid) {
        // 👑 Admin
        const path = collection(db, `users/${user.uid}/products`);
        unsubscribe = onSnapshot(path, (snap) => {
          const data = snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              name: d.nama ?? "-",
              price: d.harga_jual ?? 0,
              stock: d.totalStok ?? d.stok ?? 0,
              imageUri: d.imageUri ?? "",
              category: d.kategori ?? "-",
            };
          });
          setProducts(data);
          setCategories([...new Set(data.map((d) => d.category ?? "-"))]);
        });
      }
    };

    fetch();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // 🔄 Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const stored = await AsyncStorage.getItem("employeeProfile");
      if (stored) {
        const { adminUid, id: karyawanUid } = JSON.parse(stored);
        const snap = await getDocs(collection(db, `users/${adminUid}/employees/${karyawanUid}/products`));
        const data = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.nama ?? "-",
            price: d.harga_jual ?? 0,
            stock: d.totalStok ?? d.stok ?? 0,
            imageUri: d.imageUri ?? "",
            category: d.kategori ?? "-",
          };
        });
        setProducts(data);
        setCategories([...new Set(data.map((d) => d.category ?? "-"))]);
      } else if (user?.uid) {
        const snap = await getDocs(collection(db, `users/${user.uid}/products`));
        const data = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.nama ?? "-",
            price: d.harga_jual ?? 0,
            stock: d.totalStok ?? d.stok ?? 0,
            imageUri: d.imageUri ?? "",
            category: d.kategori ?? "-",
          };
        });
        setProducts(data);
        setCategories([...new Set(data.map((d) => d.category ?? "-"))]);
      }
    } catch (e) {
      Alert.alert("Gagal", "Tidak bisa refresh produk.");
    } finally {
      setRefreshing(false);
    }
  };

  // 🔍 Filter produk
  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) && (!selectedCategory || p.category === selectedCategory));
  }, [search, selectedCategory, products]);

  const addToCart = (product: Product) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      return found ? prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)) : [...prev, { ...product, qty: 1 }];
    });
  };

  const decreaseQty = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item)).filter((i) => i.qty > 0));
  };

  const getQty = (id: string) => cart.find((i) => i.id === id)?.qty || 0;
  const total = useMemo(() => cart.reduce((a, b) => a + b.price * b.qty, 0), [cart]);

  const handleGoToPayment = () => {
    if (cart.length === 0) return Alert.alert("Keranjang kosong", "Pilih produk terlebih dahulu.");
    modalRef.current?.close();
    router.push({ pathname: "/pembayaran", params: { total: total.toString(), items: JSON.stringify(cart) } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#D32F2F" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
          <TextInput placeholder="Cari produk..." value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
          <Ionicons name={viewMode === "list" ? "grid-outline" : "list-outline"} size={22} color="#D32F2F" />
        </TouchableOpacity>
        <FlatList
          data={["Semua", ...categories]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedCategory(item === "Semua" ? null : item)}>
              <Text style={[styles.filterBtn, selectedCategory === item && styles.activeBtn]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Produk */}
      <FlatList
        data={filteredProducts}
        key={viewMode}
        numColumns={viewMode === "grid" ? 2 : 1}
        columnWrapperStyle={viewMode === "grid" ? { justifyContent: "space-between", gap: 12 } : undefined}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#000"]} />}
        renderItem={({ item }) => {
          const qty = getQty(item.id);
          return (
            <View style={[styles.productCard, viewMode === "grid" && { flexBasis: "48%", maxWidth: "48%" }]}>
              <Image source={item.imageUri ? { uri: item.imageUri } : require("../../assets/placeholder-image.png")} style={styles.productImage} />
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>Rp{item.price.toLocaleString("id-ID")}</Text>
              <Text style={styles.productStock}>Stok: {item.stock}</Text>
              {qty === 0 ? (
                <TouchableOpacity onPress={() => addToCart(item)} style={styles.addBtn}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Tambah</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.qtyController}>
                  <TouchableOpacity onPress={() => decreaseQty(item.id)}>
                    <Ionicons name="remove-circle" size={26} color="#D32F2F" />
                  </TouchableOpacity>
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>{qty}</Text>
                  <TouchableOpacity onPress={() => addToCart(item)}>
                    <Ionicons name="add-circle" size={26} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Modal Total */}
      <TouchableOpacity onPress={() => modalRef.current?.open()} style={styles.tagihButton}>
        <Text style={styles.tagihText}>Tagih • Rp{total.toLocaleString("id-ID")}</Text>
      </TouchableOpacity>

      <Modalize ref={modalRef} modalHeight={400}>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>{cart.length} Produk</Text>
          {cart.map((item) => (
            <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
                <Text style={{ color: "#777" }}>
                  Rp{item.price.toLocaleString("id-ID")} x {item.qty}
                </Text>
              </View>
              <Text style={{ fontWeight: "bold" }}>Rp{(item.price * item.qty).toLocaleString("id-ID")}</Text>
            </View>
          ))}
          <View style={{ borderTopWidth: 1, borderColor: "#eee", marginTop: 20, paddingTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "bold" }}>Total</Text>
            <Text style={{ fontWeight: "bold" }}>Rp{total.toLocaleString("id-ID")}</Text>
          </View>
          <TouchableOpacity onPress={handleGoToPayment} style={{ marginTop: 20, backgroundColor: "#D32F2F", padding: 14, borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>Lanjut ke Pembayaran</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </View>
  );
}

// ...STYLE
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  searchBox: { flex: 1, flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 8, paddingHorizontal: 10, alignItems: "center", height: 40 },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  filterRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  filterBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, backgroundColor: "#f3f4f6", marginRight: 6, color: "#333" },
  activeBtn: { backgroundColor: "#D32F2F", color: "#fff" },
  productCard: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#eee", flex: 1 },
  productImage: { width: "100%", height: 100, borderRadius: 8, marginBottom: 6, backgroundColor: "#f3f3f3", resizeMode: "cover" },
  productName: { fontWeight: "bold", fontSize: 14, marginBottom: 2 },
  productPrice: { color: "green", fontSize: 13 },
  productStock: { fontSize: 12, color: "#555", marginTop: 2 },
  addBtn: { marginTop: 10, backgroundColor: "#D32F2F", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 8, gap: 6 },
  addBtnText: { color: "#fff", fontWeight: "bold" },
  qtyController: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tagihButton: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#D32F2F", padding: 16, alignItems: "center" },
  tagihText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
