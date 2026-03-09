import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Dimensions, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { getDocs, collection } from "firebase/firestore";
import { Picker } from "@react-native-picker/picker";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface ProductStat {
  name: string;
  qty: number;
  percentage: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const screenWidth = Dimensions.get("window").width - 40;

export default function TopProductScreen() {
  const [data, setData] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const colors = ["#facc15", "#60a5fa", "#f87171", "#34d399", "#a78bfa", "#f97316", "#14b8a6"];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user?.uid) return;

    setLoading(true);
    try {
      const transaksiSnap = await getDocs(collection(db, `users/${user.uid}/transaksi`));
      const countMap: Record<string, number> = {};

      transaksiSnap.forEach((doc) => {
        const transaksi = doc.data();
        const tgl = transaksi.created_at?.toDate?.();

        if (tgl && tgl.getMonth() === selectedMonth && tgl.getFullYear() === selectedYear) {
          transaksi.items?.forEach((item: any) => {
            if (item.name && typeof item.qty === "number") {
              countMap[item.name] = (countMap[item.name] || 0) + item.qty;
            }
          });
        }
      });

      const totalQty = Object.values(countMap).reduce((sum, qty) => sum + qty, 0);

      const sorted = Object.entries(countMap)
        .map(([name, qty], index) => ({
          name,
          qty,
          percentage: totalQty > 0 ? (qty / totalQty) * 100 : 0, // <- selalu ada
          color: colors[index % colors.length],
          legendFontColor: "#1f2937",
          legendFontSize: 13,
        }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      setData(sorted);
    } catch (err) {
      console.error("Gagal memuat data produk terlaris", err);
      Alert.alert("Error", "Gagal memuat data produk terlaris.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [selectedMonth, selectedYear]);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/reports")}>
          <Ionicons name="arrow-back" size={24} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Produk Terlaris</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#000000ff"]} />}
        alwaysBounceVertical
        bounces
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Filter */}
        <View style={styles.filterRow}>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={selectedMonth} onValueChange={setSelectedMonth}>
              {MONTHS.map((month, idx) => (
                <Picker.Item label={month} value={idx} key={month} />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={selectedYear} onValueChange={setSelectedYear}>
              {[2024, 2025, 2026].map((year) => (
                <Picker.Item label={`${year}`} value={year} key={year} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator size="large" color="#E53935" />
          ) : data.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#999" }}>Tidak ada data</Text>
          ) : (
            <PieChart
              data={data.map((item) => ({
                name: item.name,
                population: item.qty,
                color: item.color,
                legendFontColor: item.legendFontColor,
                legendFontSize: item.legendFontSize,
              }))}
              width={screenWidth}
              height={220}
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: () => "#1f2937",
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"10"}
              center={[0, 0]}
              absolute
            />
          )}
        </View>

        {/* List Produk */}
        {data.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.subTitle}>Top Produk</Text>
            {data.map((item, index) => (
              <View key={index} style={styles.listRow}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.listText}>{item.name}</Text>
                <Text style={styles.listQty}>
                  {item.qty}x ({(item.percentage ?? 0).toFixed(1)}%)
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  container: { padding: 16, flexGrow: 1 },
  filterRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  card: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  listText: { flex: 1, marginLeft: 8, fontSize: 14, color: "#444" },
  listQty: { fontWeight: "bold", color: "#111" },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
});
