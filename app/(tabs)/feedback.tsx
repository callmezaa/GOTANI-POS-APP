import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, RefreshControl } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function FeedbackPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) {
      Alert.alert("Gagal", "Pesan tidak boleh kosong.");
      return;
    }

    // Simulasi kirim ke server
    console.log("Nama:", name);
    console.log("Pesan:", message);
    Alert.alert("Terkirim", "Terima kasih atas saran/kritiknya!");

    // Reset
    setName("");
    setMessage("");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setName("");
      setMessage("");
      setRefreshing(false);
    }, 800);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#000"]} />}
        alwaysBounceVertical
        bounces
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Icon & Subtitle */}
        <View style={styles.header}>
          <MaterialIcons name="feedback" size={56} color="#D32F2F" />
          <Text style={styles.title}>Kritik & Saran</Text>
          <Text style={styles.subtitle}>Ayo bantu aplikasi POS menjadi lebih baik dengan masukanmu</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Nama (opsional)</Text>
          <TextInput style={styles.input} placeholder="Tulis namamu..." value={name} onChangeText={setName} />

          <Text style={styles.label}>Pesan</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Tulis pesanmu di sini..." value={message} onChangeText={setMessage} multiline />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Kirim</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  form: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    color: "#111827",
    marginBottom: 16,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
