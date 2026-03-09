import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // toggle login mode

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      Alert.alert("Error", "Semua field wajib diisi");
      return;
    }

    try {
      setLoading(true);

      if (isAdmin) {
        // 🔑 Login sebagai Admin via Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, emailOrUsername, password);
        const user = userCredential.user;

        await AsyncStorage.setItem("adminUid", user.uid);

        const docSnap = await getDoc(doc(db, "users", user.uid));
        const role = docSnap.exists() ? docSnap.data()?.role : "admin";

        console.log("✅ Login admin sebagai:", role);
        router.replace("/(tabs)");
      } else {
        // 🔑 Login sebagai Karyawan via Firestore
        const adminUid = await AsyncStorage.getItem("adminUid");
        if (!adminUid) {
          Alert.alert("Gagal", "Silakan login admin minimal sekali di perangkat ini.");
          return;
        }

        const q = query(
          collection(db, `users/${adminUid}/employees`),
          where("username", "==", emailOrUsername),
          where("password", "==", password) // ⚡ login pakai username+password dari Firestore
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          Alert.alert("Login Gagal", "Username atau password salah.");
          return;
        }

        const employeeDoc = snap.docs[0];
        const data = employeeDoc.data();

        await AsyncStorage.setItem(
          "employeeProfile",
          JSON.stringify({
            id: employeeDoc.id,
            name: data.name,
            role: data.role,
            photoUrl: data.photoUrl || "",
            adminUid: adminUid,
          })
        );

        console.log("✅ Login karyawan berhasil:", data);
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let msg = "Login gagal.";
      if (error.code === "auth/user-not-found") msg = "Pengguna tidak ditemukan";
      else if (error.code === "auth/wrong-password") msg = "Password salah";
      Alert.alert("Login Gagal", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome</Text>
      <Text style={styles.title}>Sign In</Text>

      {/* Toggle Role */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={[styles.toggleButton, isAdmin && styles.activeToggle]} onPress={() => setIsAdmin(true)}>
          <Text style={[styles.toggleText, isAdmin && styles.activeToggleText]}>Admin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleButton, !isAdmin && styles.activeToggle]} onPress={() => setIsAdmin(false)}>
          <Text style={[styles.toggleText, !isAdmin && styles.activeToggleText]}>Karyawan</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{isAdmin ? "Email" : "Username"}</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder={isAdmin ? "Email" : "Username"} value={emailOrUsername} onChangeText={setEmailOrUsername} autoCapitalize="none" keyboardType={isAdmin ? "email-address" : "default"} />
        </View>
      </View>

      {/* Password */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {isAdmin && (
        <TouchableOpacity onPress={() => router.push("/auth/forgot-password")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Processing..." : "Sign In"}</Text>
      </TouchableOpacity>

      {isAdmin && (
        <Text style={styles.bottomText}>
          Don’t have an account?{" "}
          <Text style={styles.signUp} onPress={() => router.push("/auth/register")}>
            Sign Up
          </Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 24, justifyContent: "center" },
  welcome: { fontSize: 22, color: "#222", marginBottom: 4 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 32, color: "#000" },
  toggleContainer: { flexDirection: "row", backgroundColor: "#f1f1f1", borderRadius: 10, overflow: "hidden", marginBottom: 24 },
  toggleButton: { flex: 1, paddingVertical: 10, alignItems: "center" },
  toggleText: { fontWeight: "bold", color: "#666" },
  activeToggle: { backgroundColor: "#D32F2F" },
  activeToggleText: { color: "#fff" },
  inputContainer: { marginBottom: 16 },
  label: { fontWeight: "bold", marginBottom: 6, color: "#000" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F0F0", borderRadius: 10, paddingHorizontal: 10, elevation: 2 },
  input: { paddingVertical: 14, fontSize: 16, color: "#000" },
  eyeIcon: { padding: 8 },
  forgotPassword: { textAlign: "right", color: "#444", marginBottom: 24, fontSize: 14 },
  button: { backgroundColor: "#E53935", paddingVertical: 14, borderRadius: 10, alignItems: "center", elevation: 3 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  bottomText: { marginTop: 24, textAlign: "center", fontSize: 14, color: "#222" },
  signUp: { fontWeight: "bold", color: "#000" },
});
