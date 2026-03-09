import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

export default function CustomDrawer({ closeDrawer }: { closeDrawer: () => void }) {
  const router = useRouter();

  return (
    <View style={styles.drawer}>
      {/* Header User Info */}
      <View style={styles.header}>
        <Image source={require("../assets/icons/user.png")} style={styles.userIcon} />
        <View>
          <Text style={styles.username}>Username</Text>
          <Text style={styles.role}>Admin</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Menu List */}
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/add-product")}>
        <Image source={require("../assets/icons/box.png")} style={styles.menuIcon} />
        <Text style={styles.menuText}>Kelola produk</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/transaction-history")}>
        <Image source={require("../assets/icons/transaction.png")} style={styles.menuIcon} />
        <Text style={styles.menuText}>Riwayat Transaksi</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/reports")}>
        <Image source={require("../assets/icons/report.png")} style={styles.menuIcon} />
        <Text style={styles.menuText}>Laporan</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/settings")}>
        <Image source={require("../assets/icons/gear.png")} style={styles.menuIcon} />
        <Text style={styles.menuText}>Pengaturan</Text>
      </TouchableOpacity>

      {/* Log Out Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={() => console.log("Logging out...")}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  userIcon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },
  role: {
    fontSize: 14,
    color: "#777",
  },
  divider: {
    height: 1,
    backgroundColor: "#aaa",
    marginVertical: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 15,
  },
  menuIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  logoutButton: {
    marginTop: 40,
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
