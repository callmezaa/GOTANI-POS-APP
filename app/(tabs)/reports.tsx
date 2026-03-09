import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { RoleGuard } from "../../components/RoleGuard";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function Reports() {
  const router = useRouter();

  const laporanList = [
    {
      title: "Transaksi Penjualan",
      icon: <MaterialCommunityIcons name="cash-register" size={26} color="#D32F2F" />,
      path: "/laporan/transaksi-penjualan",
    },
    {
      title: "Omzet Per Bulan",
      icon: <Ionicons name="bar-chart-outline" size={26} color="#D32F2F" />,
      path: "/laporan/omzet-per-bulan",
    },
    {
      title: "Produk Terlaris",
      icon: <FontAwesome5 name="crown" size={22} color="#D32F2F" />,
      path: "/laporan/produk-terlaris",
    },
    {
      title: "Produk Terjual",
      icon: <Ionicons name="pricetags-outline" size={24} color="#D32F2F" />,
      path: "/laporan/produk-terjual",
    },
    {
      title: "Riwayat Transaksi Karyawan",
      icon: <Feather name="users" size={24} color="#D32F2F" />,
      path: "/laporan/riwayat-transaksi-karyawan",
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D32F2F" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Laporan</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {laporanList.map((item, index) => (
            <Animated.View key={index} entering={FadeInUp.delay(index * 80).duration(400)} style={styles.listItemWrapper}>
              <Pressable onPress={() => router.push(item.path as any)} style={({ pressed }) => [styles.listItem, pressed && { opacity: 0.7 }]}>
                {/* Left section */}
                <View style={styles.listLeft}>
                  <View style={styles.iconWrapper}>{item.icon}</View>
                  <Text style={styles.listText}>{item.title}</Text>
                </View>

                {/* Right arrow */}
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    padding: 6,
    borderRadius: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  scroll: {
    flex: 1,
    paddingTop: 10,
  },

  listItemWrapper: {
    paddingHorizontal: 18,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,

    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  iconWrapper: {
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  listText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
});
