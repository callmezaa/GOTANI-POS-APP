import { StyleSheet } from "react-native";

// Export font family agar bisa digunakan global
export const fonts = {
  regular: "Poppins_400Regular",
  semiBold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: "#007bff",
  },
});
