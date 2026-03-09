import React, { useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert, ToastAndroid, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useRouter } from "expo-router";

export default function UbahPasswordScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureEntry, setSecureEntry] = useState(true);
  const [secureEntryNew, setSecureEntryNew] = useState(true);
  const [secureEntryConfirm, setSecureEntryConfirm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isMatching = newPassword === confirmPassword;

  const getPasswordStrength = (password: string) => {
    if (!password) return { level: "", color: "#9CA3AF", score: 0, tips: "" };

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[@$!%*?&#]/.test(password);

    if (password.length < 6) return { level: "Lemah", color: "#EF4444", score: 33, tips: "Gunakan minimal 6 karakter." };
    if (password.length >= 6 && ((hasLower && hasNumber) || (hasUpper && hasNumber))) return { level: "Sedang", color: "#F59E0B", score: 66, tips: "Tambahkan huruf besar, simbol, atau angka untuk memperkuat." };
    if (password.length >= 8 && hasLower && hasUpper && hasNumber && hasSymbol) return { level: "Kuat", color: "#10B981", score: 100, tips: "" };

    return { level: "Sedang", color: "#F59E0B", score: 66, tips: "Gunakan kombinasi huruf, angka, dan simbol." };
  };

  const strength = getPasswordStrength(newPassword);

  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("Info", message);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) {
      Alert.alert("Error", "Pengguna belum login.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Validasi", "Semua kolom wajib diisi.");
      return;
    }

    if (!isMatching) {
      Alert.alert("Error", "Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (strength.level === "Lemah") {
      Alert.alert("Error", "Gunakan kata sandi yang lebih kuat.");
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert("Error", "Kata sandi baru tidak boleh sama dengan yang lama.");
      return;
    }

    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      showToast("Berhasil mengubah kata sandi.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Gagal", "Gagal mengubah kata sandi. Cek kembali kata sandi lama.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/settings")}>
          <Ionicons name="arrow-back" size={24} color="#DC2626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ubah Kata Sandi</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#000"]} />}
        alwaysBounceVertical
        bounces
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Password Lama */}
        <View style={styles.inputGroup}>
          <TextInput style={styles.input} placeholder="Kata sandi saat ini" secureTextEntry={secureEntry} value={currentPassword} onChangeText={setCurrentPassword} />
          <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)} style={styles.eyeIcon}>
            <Ionicons name={secureEntry ? "eye-off" : "eye"} size={20} color="#777" />
          </TouchableOpacity>
        </View>

        {/* Password Baru */}
        <View style={styles.inputGroup}>
          <TextInput style={styles.input} placeholder="Kata sandi baru" secureTextEntry={secureEntryNew} value={newPassword} onChangeText={setNewPassword} />
          <TouchableOpacity onPress={() => setSecureEntryNew(!secureEntryNew)} style={styles.eyeIcon}>
            <Ionicons name={secureEntryNew ? "eye-off" : "eye"} size={20} color="#777" />
          </TouchableOpacity>
        </View>

        {/* Strength Meter */}
        {newPassword.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.strengthText, { color: strength.color }]}>Kekuatan Sandi: {strength.level}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${strength.score}%`, backgroundColor: strength.color }]} />
            </View>
            {strength.tips ? <Text style={styles.tipsText}>💡 {strength.tips}</Text> : null}
          </View>
        )}

        {/* Konfirmasi Password */}
        <View style={styles.inputGroup}>
          <TextInput style={styles.input} placeholder="Konfirmasi kata sandi baru" secureTextEntry={secureEntryConfirm} value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity onPress={() => setSecureEntryConfirm(!secureEntryConfirm)} style={styles.eyeIcon}>
            <Ionicons name={secureEntryConfirm ? "eye-off" : "eye"} size={20} color="#777" />
          </TouchableOpacity>
        </View>

        {/* Validasi */}
        {!isMatching && confirmPassword.length > 0 && <Text style={styles.errorText}>Konfirmasi tidak cocok.</Text>}

        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Memproses..." : "Ubah Kata Sandi"}</Text>
        </TouchableOpacity>
      </ScrollView>
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
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  inputGroup: { position: "relative", marginBottom: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    paddingRight: 42,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    color: "#111827",
  },
  eyeIcon: { position: "absolute", right: 12, top: 14 },
  strengthText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  tipsText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#DC2626",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  errorText: { color: "#E53935", fontSize: 13, marginTop: -6, marginBottom: 12 },
});
