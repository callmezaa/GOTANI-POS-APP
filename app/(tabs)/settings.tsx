import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

export default function Settings() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const menuList = [
    {
      title: "Profil",
      path: "/pengaturan/profil",
      icon: <Ionicons name="person-circle-outline" size={22} color="#DC2626" />,
    },
    {
      title: "Struk",
      path: "/pengaturan/struk",
      icon: <MaterialIcons name="receipt-long" size={22} color="#DC2626" />,
    },
    {
      title: "Ubah Kata Sandi",
      path: "/pengaturan/ubah-password",
      icon: <Feather name="lock" size={22} color="#DC2626" />,
    },
  ];

  const handleDeleteAccount = () => {
    Alert.alert(
      "Konfirmasi",
      "Apakah Anda yakin ingin menghapus akun?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => console.log("Akun dihapus"),
        },
      ],
      { cancelable: true }
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#DC2626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan</Text>
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
        <View style={styles.card}>
          {menuList.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.item, index === menuList.length - 1 && { borderBottomWidth: 0 }]} onPress={() => router.push(item.path as any)}>
              <View style={styles.left}>
                {item.icon}
                <Text style={styles.itemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Delete Account */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Feather name="trash-2" size={20} color="#DC2626" />
          <Text style={styles.deleteText}>Hapus Akun</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemText: { fontSize: 15, fontWeight: "500", color: "#1F2937" },
  deleteBtn: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  deleteText: {
    fontSize: 15,
    color: "#DC2626",
    fontWeight: "bold",
  },
});
