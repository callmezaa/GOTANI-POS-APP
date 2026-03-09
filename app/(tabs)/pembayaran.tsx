import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PembayaranPage() {
  const router = useRouter();
  const { total, items } = useLocalSearchParams();

  const totalBayar = typeof total === "string" ? parseInt(total) : 0;
  const parsedItems = typeof items === "string" ? JSON.parse(items) : [];

  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const goToConfirm = (method: "cash" | "online") => {
    router.push({
      pathname: "/payment/confirm",
      params: {
        method,
        total: totalBayar.toString(),
        items,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/add-transaction")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#D32F2F" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pembayaran</Text>

        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />} contentContainerStyle={{ paddingBottom: 120 }}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Total */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Bayar</Text>
            <Text style={styles.totalAmount}>Rp{totalBayar.toLocaleString("id-ID")}</Text>
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metode Pembayaran</Text>

            <TouchableOpacity style={styles.paymentOption} onPress={() => goToConfirm("cash")}>
              <Ionicons name="cash-outline" size={20} color="#D32F2F" />
              <Text style={styles.optionText}>Tunai</Text>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.paymentOption} onPress={() => goToConfirm("online")}>
              <Ionicons name="globe-outline" size={20} color="#D32F2F" />
              <Text style={styles.optionText}>Pembayaran Online</Text>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Order Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rincian Pesanan</Text>

            {parsedItems.length === 0 ? (
              <Text style={styles.emptyText}>Tidak ada item.</Text>
            ) : (
              parsedItems.map((item: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetail}>
                      x{item.qty} • Rp{item.price.toLocaleString("id-ID")}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>Rp{(item.price * item.qty).toLocaleString("id-ID")}</Text>
                </View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Delete */}
      <TouchableOpacity style={styles.deleteButton} onPress={() => router.replace("/add-transaction")}>
        <Ionicons name="trash-outline" size={18} color="#D32F2F" />
        <Text style={styles.deleteText}>Hapus Transaksi</Text>
      </TouchableOpacity>
    </View>
  );
}

/* STYLES =============================================================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f8" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  /* TOTAL */
  totalContainer: {
    backgroundColor: "#FFF5F5",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 13,
    color: "#B91C1C",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: "700",
    color: "#D32F2F",
  },

  /* SECTION */
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 10,
  },

  /* PAYMENT OPTION */
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },

  /* ITEMS */
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    paddingVertical: 12,
  },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  itemDetail: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: "600", color: "#D32F2F" },

  emptyText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    marginTop: 6,
  },

  /* BOTTOM DELETE */
  deleteButton: {
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#D32F2F",
  },
});
