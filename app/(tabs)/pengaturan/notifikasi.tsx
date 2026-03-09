import { View, Text, StyleSheet } from "react-native";

export default function NotifikasiScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pengaturan Notifikasi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
