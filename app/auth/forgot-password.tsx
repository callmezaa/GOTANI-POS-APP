import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebaseConfig";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const handleResetPassword = async () => {
  if (!email) {
    Alert.alert("Error", "Email harus diisi.");
    return;
  }

  if (!email.includes("@")) {
    Alert.alert("Error", "Format email tidak valid.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    Alert.alert("Berhasil", "Link reset password telah dikirim ke email Anda.");
  } catch (error: any) {
    console.log("RESET ERROR:", error.code);

    switch (error.code) {
      case "auth/user-not-found":
        Alert.alert("Gagal", "Email tidak terdaftar.");
        break;
      case "auth/invalid-email":
        Alert.alert("Gagal", "Format email tidak valid.");
        break;
      default:
        Alert.alert("Gagal", error.message);
    }
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      <Image
        source={require("../../assets/email_icon.png")} // Ganti dengan path gambarmu
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.description}>Please enter your email address to receive a verification code.</Text>

      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#000",
  },
  input: {
    width: "100%",
    backgroundColor: "#F3F0F0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    elevation: 2,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
