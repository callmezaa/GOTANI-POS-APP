import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc, runTransaction } from "firebase/firestore";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const role = "admin"; // ⬅️ Dipaksa sebagai admin

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Semua field harus diisi.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Password tidak cocok.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: username,
      });

      // 1. Simpan data user ke /users/{uid}
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: username,
        email,
        role: "admin",
        createdAt: new Date(),
      });

      // 2. Kalau role = admin, tambahkan UID ke /admins/index
      if (role === "admin") {
        const adminIndexRef = doc(db, "admins", "index");
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(adminIndexRef);

          if (!snapshot.exists()) {
            transaction.set(adminIndexRef, { uids: [user.uid] });
          } else {
            const currentUIDs = snapshot.data().uids || [];
            if (!currentUIDs.includes(user.uid)) {
              transaction.update(adminIndexRef, {
                uids: [...currentUIDs, user.uid],
              });
            }
          }
        });
      }

      Alert.alert("Berhasil", "Registrasi berhasil! Silakan login.");
      router.replace("/auth/login");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Registrasi Gagal", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {/* Username */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Nama pengguna" value={username} onChangeText={setUsername} />
        </View>
      </View>

      {/* Email */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Email aktif" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>
      </View>

      {/* Password */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Minimal 6 karakter" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Ulangi password" secureTextEntry={!showConfirm} value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity onPress={() => setShowConfirm((prev) => !prev)} style={styles.eyeIcon}>
            <Ionicons name={showConfirm ? "eye" : "eye-off"} size={22} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tombol Daftar */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Link ke Login */}
      <Text style={styles.bottomText}>
        Already have an account?{" "}
        <Text style={styles.signIn} onPress={() => router.replace("/auth/login")}>
          Sign In
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#000",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F0F0",
    borderRadius: 10,
    paddingHorizontal: 10,
    elevation: 2,
  },
  input: {
    paddingVertical: 14,
    fontSize: 16,
    color: "#000",
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  bottomText: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 14,
    color: "#222",
  },
  signIn: {
    fontWeight: "bold",
    color: "#000",
  },
});
