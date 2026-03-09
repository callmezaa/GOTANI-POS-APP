import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";

export default function AddCategoryForm() {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState("");

  const handleAddCategory = () => {
    if (!categoryName.trim()) {
      Alert.alert("Validasi", "Nama kategori tidak boleh kosong!");
      return;
    }

    // TODO: Simpan ke database (contoh Firebase/AsyncStorage)
    console.log("Kategori Ditambahkan:", categoryName);

    Alert.alert("Sukses", "Kategori berhasil ditambahkan!");
    router.back(); // Kembali ke halaman sebelumnya
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Kategori</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Nama Kategori</Text>
        <TextInput style={styles.input} placeholder="Contoh: Minuman" value={categoryName} onChangeText={setCategoryName} />
      </View>

      {/* Button Simpan */}
      <TouchableOpacity onPress={handleAddCategory} style={styles.buttonContainer}>
        <LinearGradient colors={["#D32F2F", "#B71C1C"]} style={styles.button}>
          <Text style={styles.buttonText}>Simpan</Text>
        </LinearGradient>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  form: {
    padding: 20,
    marginTop: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
