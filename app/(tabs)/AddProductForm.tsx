import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Switch } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { collection, addDoc, Timestamp, onSnapshot } from "firebase/firestore";

export default function AddProductForm() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(collection(db, `users/${user.uid}/categories`), (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
      }));
      setCategories(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  const chooseImage = async () => {
    Alert.alert("Pilih Gambar", "Sumber gambar", [
      {
        text: "Galeri",
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
          if (!res.canceled) setImageUri(res.assets[0].uri);
        },
      },
      {
        text: "Kamera",
        onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
          if (!res.canceled) setImageUri(res.assets[0].uri);
        },
      },
      { text: "Batal", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!name || !categoryId) {
      return Alert.alert("Validasi", "Nama produk dan kategori wajib diisi");
    }

    if (!user) {
      return Alert.alert("Error", "User belum login");
    }

    const categoryName = categories.find((c) => c.id === categoryId)?.name || "";

    try {
      await addDoc(collection(db, `users/${user.uid}/products`), {
        name,
        description,
        categoryId,
        categoryName,
        imageUri,
        isActive,
        createdAt: Timestamp.now(),
      });

      Alert.alert("Berhasil", "Produk berhasil ditambahkan");
      router.replace("/add-product");
    } catch (e: any) {
      Alert.alert("Gagal", e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={{ marginTop: 10 }}>Memuat kategori...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#D32F2F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tambah Produk</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* IMAGE */}
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={chooseImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={36} color="#9ca3af" />
                <Text style={styles.imageText}>Tambah Gambar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <View style={styles.card}>
          <TextInput placeholder="Nama Produk" value={name} onChangeText={setName} style={styles.input} />

          <TextInput placeholder="Deskripsi Produk (opsional)" value={description} onChangeText={setDescription} style={[styles.input, { height: 80 }]} multiline />

          <View style={styles.pickerWrapper}>
            <Picker selectedValue={categoryId} onValueChange={setCategoryId}>
              <Picker.Item label="Pilih Kategori" value="" />
              {categories.map((c) => (
                <Picker.Item key={c.id} label={c.name} value={c.id} />
              ))}
            </Picker>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Status Produk</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Simpan Produk</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  imageSection: { alignItems: "center", marginVertical: 20 },
  image: {
    width: 150,
    height: 150,
    borderRadius: 20,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  imageText: { marginTop: 8, color: "#6b7280", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 14,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  saveButton: {
    marginTop: 28,
    backgroundColor: "#D32F2F",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
