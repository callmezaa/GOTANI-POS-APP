import React, { useCallback, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useUser } from "../contexts/UserContext";
import LottieView from "lottie-react-native";
import { useRouter, useFocusEffect } from "expo-router";

type Props = {
  allowedRoles: ("admin" | "karyawan")[];
  children: React.ReactNode;
};

export const RoleGuard: React.FC<Props> = ({ allowedRoles, children }) => {
  const { role, loading } = useUser();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  // ✅ Pakai useFocusEffect agar modal muncul setiap halaman difokuskan kembali
  useFocusEffect(
    useCallback(() => {
      if (!loading && role && !allowedRoles.includes(role)) {
        setShowModal(true);
      } else {
        setShowModal(false); // reset modal jika sudah diizinkan
      }
    }, [role, loading])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <LottieView source={require("../assets/animations/lock.json")} autoPlay loop={false} style={{ width: 160, height: 160 }} />
            <Text style={styles.title}>Akses Ditolak</Text>
            <Text style={styles.message}>Halaman ini hanya dapat diakses oleh Admin.</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setShowModal(false);
                router.replace("/(tabs)");
              }}
            >
              <Text style={styles.buttonText}>Kembali</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D32F2F",
    marginTop: 12,
  },
  message: {
    fontSize: 15,
    color: "#444",
    textAlign: "center",
    marginVertical: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#D32F2F",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
