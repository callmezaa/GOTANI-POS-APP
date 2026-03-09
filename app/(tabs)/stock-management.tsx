import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { RoleGuard } from "../../components/RoleGuard";

export default function StockManagement() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        bounces={true}
        alwaysBounceVertical={true}
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} color="#D32F2F" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Manajemen Stok</Text>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          <MenuItem icon={<MaterialIcons name="inventory" size={22} color="#D32F2F" />} label="Kelola Stok" onPress={() => router.push("/stock/kelola")} />
          <MenuItem icon={<MaterialCommunityIcons name="truck-delivery-outline" size={22} color="#D32F2F" />} label="Pembagian Stok" onPress={() => router.push("/stock/pembagian")} />
          <MenuItem icon={<MaterialCommunityIcons name="account-group-outline" size={22} color="#D32F2F" />} label="Supplier" onPress={() => router.push("/stock/supplier")} />
        </View>
      </ScrollView>
    </RoleGuard>
  );
}

function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  menuContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
});
