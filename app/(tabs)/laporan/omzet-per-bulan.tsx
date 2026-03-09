import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Animated } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get("window").width;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function OmzetPerBulanPremiumPlus() {
  const [omzetData, setOmzetData] = useState<number[]>(new Array(12).fill(0));
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [totalOmzet, setTotalOmzet] = useState<number>(0);

  // extra analytics
  const [prevYearTotal, setPrevYearTotal] = useState<number>(0);
  const [percentChange, setPercentChange] = useState<number | null>(null);
  const [highestMonthIndex, setHighestMonthIndex] = useState<number | null>(null);
  const [lowestMonthIndex, setLowestMonthIndex] = useState<number | null>(null);
  const [quarterData, setQuarterData] = useState<number[]>([0, 0, 0, 0]);

  const router = useRouter();

  // animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    fetchOmzetAllYears();
    // animate in when component mounted or data changed
    Animated.parallel([Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }), Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true })]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const fetchOmzetAllYears = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user?.uid) return;

      const snapshot = await getDocs(collection(db, `users/${user.uid}/transaksi`));
      // aggregate per month for selectedYear and previousYear
      const dataThisYear = new Array(12).fill(0);
      const dataPrevYear = new Array(12).fill(0);

      snapshot.forEach((doc) => {
        const d = doc.data();
        const created = d.created_at?.toDate?.();
        if (!created) return;

        const year = created.getFullYear();
        const month = created.getMonth();
        const nominal = Number(d.total ?? d.diterima ?? 0) || 0;

        if (year === selectedYear) dataThisYear[month] += nominal;
        if (year === selectedYear - 1) dataPrevYear[month] += nominal;
      });

      const totalThis = dataThisYear.reduce((a, b) => a + b, 0);
      const totalPrev = dataPrevYear.reduce((a, b) => a + b, 0);

      // compute quarter totals
      const q1 = dataThisYear[0] + dataThisYear[1] + dataThisYear[2];
      const q2 = dataThisYear[3] + dataThisYear[4] + dataThisYear[5];
      const q3 = dataThisYear[6] + dataThisYear[7] + dataThisYear[8];
      const q4 = dataThisYear[9] + dataThisYear[10] + dataThisYear[11];

      setQuarterData([q1, q2, q3, q4]);
      setOmzetData(dataThisYear);
      setTotalOmzet(totalThis);
      setPrevYearTotal(totalPrev);

      // highest & lowest month index
      const maxVal = Math.max(...dataThisYear);
      const minVal = Math.min(...dataThisYear);
      setHighestMonthIndex(maxVal > 0 ? dataThisYear.indexOf(maxVal) : null);
      setLowestMonthIndex(minVal < Number.MAX_SAFE_INTEGER ? dataThisYear.indexOf(minVal) : null);

      // percent change
      if (totalPrev === 0 && totalThis === 0) setPercentChange(0);
      else if (totalPrev === 0) setPercentChange(100);
      else setPercentChange(((totalThis - totalPrev) / Math.abs(totalPrev)) * 100);
    } catch (err) {
      console.error("Error fetching omzet:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOmzetAllYears();
  }, [selectedYear]);

  const handleChangeYear = (dir: "next" | "prev") => {
    setSelectedYear((y) => y + (dir === "next" ? 1 : -1));
    // reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(12);
  };

  // helpers
  const formatIDR = (v: number) => {
    try {
      return v.toLocaleString("id-ID");
    } catch {
      return String(v);
    }
  };

  const avgPerMonth = totalOmzet / 12 || 0;

  // UI colors for highlights (style A: soft)
  const highestBg = "rgba(255,236,179,0.9)"; // soft gold
  const lowestBg = "rgba(207,242,255,0.9)"; // soft blue

  // quarter labels
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/reports")} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Omzet Per Bulan</Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        {/* Year selector */}
        <Animated.View style={[styles.yearCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={() => handleChangeYear("prev")} style={styles.yearButton}>
            <Ionicons name="chevron-back" size={20} color="#333" />
          </TouchableOpacity>

          <Text style={styles.yearText}>{selectedYear}</Text>

          <TouchableOpacity onPress={() => handleChangeYear("next")} style={styles.yearButton}>
            <Ionicons name="chevron-forward" size={20} color="#333" />
          </TouchableOpacity>
        </Animated.View>

        {/* Stat cards */}
        <Animated.View style={[styles.statRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>Rp {formatIDR(totalOmzet)}</Text>
            <Text style={styles.statSub}>Tahun {selectedYear}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rata-rata / bulan</Text>
            <Text style={styles.statValue}>Rp {formatIDR(Math.round(avgPerMonth))}</Text>
            <Text style={styles.statSub}>±</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tahun lalu</Text>
            <Text style={styles.statValue}>Rp {formatIDR(prevYearTotal)}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              {percentChange !== null && (
                <React.Fragment>
                  <MaterialIcons name={percentChange >= 0 ? "trending-up" : "trending-down"} size={16} color={percentChange >= 0 ? "#16a34a" : "#ef4444"} style={{ marginRight: 6 }} />
                  <Text style={{ color: percentChange >= 0 ? "#16a34a" : "#ef4444", fontWeight: "700" }}>{Math.abs(Math.round(percentChange))}%</Text>
                </React.Fragment>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Chart card */}
        <Animated.View style={[styles.chartCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {loading ? (
            <ActivityIndicator size="large" color="#D32F2F" />
          ) : (
            <>
              <LineChart
                data={{
                  labels: MONTH_LABELS,
                  datasets: [{ data: omzetData.map((d) => Math.round(d / 1000)) }],
                }}
                width={screenWidth - 40}
                height={260}
                yAxisSuffix="k"
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(211, 47, 47, ${opacity})`,
                  labelColor: () => "#6b7280",
                  propsForDots: { r: "5", strokeWidth: "2", stroke: "#b91c1c" },
                }}
                bezier
                style={styles.chart}
              />

              {/* badges: highlight highest/lowest months under chart */}
              <View style={styles.badgeRow}>
                {highestMonthIndex !== null && (
                  <View style={[styles.badge, { backgroundColor: highestBg }]}>
                    <MaterialIcons name="star" size={14} color="#b58100" />
                    <Text style={styles.badgeText}>
                      Terbesar: {MONTH_LABELS[highestMonthIndex]} — Rp {formatIDR(omzetData[highestMonthIndex])}
                    </Text>
                  </View>
                )}

                {lowestMonthIndex !== null && (
                  <View style={[styles.badge, { backgroundColor: lowestBg }]}>
                    <MaterialIcons name="arrow-downward" size={14} color="#0369a1" />
                    <Text style={styles.badgeText}>
                      Terendah: {MONTH_LABELS[lowestMonthIndex]} — Rp {formatIDR(omzetData[lowestMonthIndex])}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </Animated.View>

        {/* Quarter cards horizontal */}
        <Animated.View style={[styles.quarterWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Omzet per Kuartal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
            {quarterData.map((q, idx) => {
              const isHighestQuarter = q === Math.max(...quarterData);
              return (
                <View key={idx} style={[styles.qCard, isHighestQuarter && styles.qCardHighlight]}>
                  <Text style={styles.qLabel}>{quarters[idx]}</Text>
                  <Text style={styles.qValue}>Rp {formatIDR(q)}</Text>
                  <Text style={styles.qSub}>({Math.round((q / (totalOmzet || 1)) * 100)}%)</Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Monthly summary list with soft highlight row */}
        <Animated.View style={[styles.summaryCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.summaryTitle}>Ringkasan Bulanan</Text>
          {MONTH_LABELS.map((m, i) => {
            const isHighest = i === highestMonthIndex;
            const isLowest = i === lowestMonthIndex;
            return (
              <View key={i} style={[styles.summaryRow, isHighest && styles.rowHighest, isLowest && styles.rowLowest]}>
                <Text style={[styles.summaryMonth, isHighest && styles.textHighest, isLowest && styles.textLowest]}>{m}</Text>
                <Text style={[styles.summaryValue, isHighest && styles.textHighest, isLowest && styles.textLowest]}>Rp {formatIDR(omzetData[i])}</Text>
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* local styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  header: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  headerIcon: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  yearCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    marginBottom: 12,
  },
  yearButton: { paddingHorizontal: 10 },
  yearText: { marginHorizontal: 12, fontSize: 18, fontWeight: "800", color: "#b91c1c" },

  statRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 6,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  statLabel: { color: "#666", fontSize: 12 },
  statValue: { fontSize: 16, fontWeight: "800", marginTop: 6, color: "#111" },
  statSub: { color: "#888", fontSize: 11, marginTop: 6 },

  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    marginBottom: 16,
    alignItems: "center",
  },
  chart: { borderRadius: 12 },

  badgeRow: { width: "100%", marginTop: 12, flexDirection: "column", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: { marginLeft: 8, color: "#333", fontWeight: "700", fontSize: 13 },

  quarterWrapper: { marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8, color: "#222" },
  qCard: {
    width: 120,
    marginHorizontal: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  qCardHighlight: { backgroundColor: "rgba(255,249,230,0.95)", borderWidth: 1, borderColor: "#fde68a" },
  qLabel: { fontSize: 12, color: "#666" },
  qValue: { fontSize: 14, fontWeight: "800", marginTop: 6, color: "#111" },
  qSub: { fontSize: 12, color: "#888", marginTop: 6 },

  summaryCard: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    marginBottom: 28,
  },
  summaryTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8, color: "#111" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f3f3f3",
  },
  rowHighest: { backgroundColor: "rgba(255,249,230,0.9)" },
  rowLowest: { backgroundColor: "rgba(236,249,255,0.9)" },
  summaryMonth: { color: "#555", fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#111" },

  // Add missing textHighest and textLowest styles
  textHighest: { color: "#b58100", fontWeight: "700" },
  textLowest: { color: "#0369a1", fontWeight: "700" },
});
