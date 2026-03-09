import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ConfirmPayment() {
  const router = useRouter();
  const { total, items, method } = useLocalSearchParams();

  const parsedItems = typeof items === "string" ? JSON.parse(items) : [];
  const totalBayar = typeof total === "string" ? parseInt(total) : 0;

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLanjut = () => {
    if (method === "cash") {
      router.push({
        pathname: "/payment/cash",
        params: { total, items },
      });
    } else {
      router.push({
        pathname: "/payment/online",
        params: { total, items },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Konfirmasi Pembayaran</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Ringkasan Pembayaran</Text>

          {/* Total */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total yang harus dibayar</Text>
            <Text style={styles.totalAmount}>Rp{totalBayar.toLocaleString("id-ID")}</Text>
          </View>

          {/* Metode */}
          <View style={styles.methodBox}>
            <Text style={styles.methodLabel}>Metode Pembayaran</Text>
            <View style={styles.methodRow}>
              <Ionicons name={method === "cash" ? "cash-outline" : "globe-outline"} size={20} color="#D32F2F" />
              <Text style={styles.methodText}>{method === "cash" ? "Tunai" : "Online"}</Text>
            </View>
          </View>

          {/* Rincian Pesanan */}
          <Text style={styles.sectionTitle}>Rincian Pesanan</Text>

          {parsedItems.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetail}>
                  x{item.qty} • Rp{item.price.toLocaleString("id-ID")}
                </Text>
              </View>
              <Text style={styles.itemTotal}>Rp{(item.price * item.qty).toLocaleString("id-ID")}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleLanjut}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Lanjutkan Pembayaran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f9" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ededed",
    justifyContent: "space-between",
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
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
    color: "#111",
  },

  totalBox: {
    backgroundColor: "#FFF5F5",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 18,
  },
  totalLabel: {
    fontSize: 14,
    color: "#B91C1C",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D32F2F",
  },

  methodBox: {
    marginBottom: 20,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  methodText: {
    fontSize: 15,
    color: "#111",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginVertical: 10,
    color: "#111",
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f2f2f2",
  },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  itemDetail: { fontSize: 12, color: "#6b7280" },
  itemTotal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D32F2F",
  },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },

  button: {
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
