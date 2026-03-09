import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import LottieView from "lottie-react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const RoleBlockModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <LottieView source={require("../assets/animations/lock.json")} autoPlay loop={false} style={{ width: 160, height: 160 }} />
          <Text style={styles.title}>Akses Ditolak</Text>
          <Text style={styles.message}>Menu ini hanya dapat diakses oleh Admin.</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
