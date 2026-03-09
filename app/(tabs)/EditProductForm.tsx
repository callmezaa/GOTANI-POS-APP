import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView, Image, Switch } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc, deleteDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { RoleGuard } from "../../components/RoleGuard";

export default function EditProductForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = getAuth().currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [product, setProduct] = useState({
    name: "",
    categoryName: "",
    imageUri: "",
    isActive: true,
  });

  /* ================= FETCH CATEGORIES ================= */
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(collection(db, `users/${user.uid}/categories`), (snap) => {
      setCategories(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }))
      );
    });

    return () => unsub();
  }, [user?.uid]);

  /* ================= FETCH PRODUCT ================= */
  useEffect(() => {
    if (!user?.uid || !id) return;

    const fetchProduct = async () => {
      try {
        const ref = doc(db, `users/${user.uid}/products`, id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          Alert.alert("Produk tidak ditemukan");
          router.replace("/add-product");
          return;
        }

        const data = snap.data();
        setProduct({
          name: data.name || "",
          categoryName: data.categoryName || "",
          imageUri: data.imageUri || "",
          isActive: data.isActive ?? true,
        });
      } catch {
        Alert.alert("Gagal memuat data produk");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, user?.uid]);

  /* ================= IMAGE PICKER ================= */
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setProduct((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!user?.uid) return;
    if (!product.name.trim()) return Alert.alert("Nama produk wajib diisi");
    if (!product.categoryName) return Alert.alert("Kategori wajib dipilih");

    setSaving(true);
    try {
      await updateDoc(doc(db, `users/${user.uid}/products`, id), {
        name: product.name.trim(),
        categoryName: product.categoryName,
        imageUri: product.imageUri,
        isActive: product.isActive,
      });

      Alert.alert("Berhasil", "Produk berhasil diperbarui");
      router.replace("/add-product");
    } catch {
      Alert.alert("Gagal", "Tidak dapat menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = () => {
    if (!user?.uid) return;

    Alert.alert("Hapus Produk", `Yakin ingin menghapus produk "${product.name}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteDoc(doc(db, `users/${user.uid}/products`, id));
            Alert.alert("Produk berhasil dihapus");
            router.replace("/add-product");
          } catch {
            Alert.alert("Gagal menghapus produk");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#D32F2F" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Produk</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* IMAGE */}
          <View style={styles.imageWrapper}>
            {product.imageUri ? (
              <Image source={{ uri: product.imageUri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={30} color="#9CA3AF" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* FORM */}
          <Text style={styles.label}>Nama Produk</Text>
          <TextInput style={styles.input} value={product.name} onChangeText={(v) => setProduct((p) => ({ ...p, name: v }))} placeholder="Contoh: Tomat Segar" />

          <Text style={styles.label}>Kategori</Text>
          <View style={styles.categoryWrapper}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={[styles.categoryChip, product.categoryName === cat.name && styles.categoryActive]} onPress={() => setProduct((p) => ({ ...p, categoryName: cat.name }))}>
                <Text style={[styles.categoryText, product.categoryName === cat.name && { color: "#fff" }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* STATUS */}
          <View style={styles.statusRow}>
            <Text style={styles.label}>Status Produk</Text>
            <Switch value={product.isActive} onValueChange={(v) => setProduct((p) => ({ ...p, isActive: v }))} trackColor={{ false: "#ccc", true: "#FCA5A5" }} thumbColor={product.isActive ? "#D32F2F" : "#f4f4f4"} />
          </View>

          {/* ACTIONS */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Simpan Perubahan</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteText}>Hapus Produk</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40, backgroundColor: "#FAFAFA" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },

  imageWrapper: {
    alignItems: "center",
    marginVertical: 24,
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: -8,
    right: 110,
    backgroundColor: "#D32F2F",
    padding: 10,
    borderRadius: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginHorizontal: 20,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginHorizontal: 20,
    marginBottom: 18,
  },

  categoryWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 20,
    marginBottom: 18,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  categoryActive: {
    backgroundColor: "#D32F2F",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 28,
  },

  saveButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  deleteButton: {
    backgroundColor: "#B91C1C",
    paddingVertical: 14,
    marginHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
