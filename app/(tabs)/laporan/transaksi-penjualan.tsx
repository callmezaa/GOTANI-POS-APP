import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Modal, Pressable, ActivityIndicator, Platform, Alert } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { db } from "../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { LineChart } from "react-native-chart-kit";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import DateTimePicker from "@react-native-community/datetimepicker";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

const screenWidth = Dimensions.get("window").width - 32;

type TransaksiItem = {
  id: string;
  diterima?: number;
  total?: number;
  pesanan?: any[];
  created_at?: any;
  [key: string]: any;
};

export default function TransaksiPenjualan() {
  const [transaksi, setTransaksi] = useState<TransaksiItem[]>([]);
  const [periode, setPeriode] = useState<"hari" | "bulan" | "tahun" | "range">("bulan");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [omzet, setOmzet] = useState(0);
  const [produkTerjual, setProdukTerjual] = useState<{ nama: string; qty: number }[]>([]);
  const [produkTerlaris, setProdukTerlaris] = useState<{ nama: string; qty: number } | null>(null);
  const [jumlahTransaksi, setJumlahTransaksi] = useState(0);
  const [profit, setProfit] = useState(0);
  const [chartData, setChartData] = useState<{ labels: string[]; datasets: { data: number[] }[] } | null>(null);

  // selectors
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // range picker
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<{
    mode: "start" | "end" | null;
    visible: boolean;
  }>({ mode: null, visible: false });

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const user = getAuth().currentUser;

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, periode, selectedMonth, selectedYear, rangeStart, rangeEnd]);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setRefreshing(true);
    try {
      const snap = await getDocs(collection(db, `users/${user.uid}/transaksi`));
      const rawData: TransaksiItem[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) } as TransaksiItem));

      // Filter according to periode
      const filtered = rawData.filter((d) => {
        if (!d.created_at) return false;

        const date = parseDate(d.created_at);
        if (!date) return false;

        if (periode === "hari") {
          const today = new Date();
          return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
        }

        if (periode === "bulan") {
          return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        }

        if (periode === "tahun") {
          return date.getFullYear() === selectedYear;
        }

        if (periode === "range") {
          if (!rangeStart || !rangeEnd) return false;
          const start = new Date(rangeStart);
          start.setHours(0, 0, 0, 0);
          const end = new Date(rangeEnd);
          end.setHours(23, 59, 59, 999);
          return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
        }

        return true;
      });

      setTransaksi(filtered);
      setJumlahTransaksi(filtered.length);

      const totalOmzet = filtered.reduce((acc, item) => acc + (Number(item.diterima ?? item.total ?? 0) || 0), 0);
      setOmzet(totalOmzet);

      // compute products & profit
      let totalProfit = 0;
      const productMap: { [name: string]: number } = {};

      filtered.forEach((trx) => {
        (trx.pesanan || []).forEach((it) => {
          const nama = it.nama || it.name || "Produk";
          const qty = Number(it.qty ?? 0) || 0;
          const jual = Number(it.hargaJual ?? it.price ?? 0) || 0;
          const modal = Number(it.hargaModal ?? it.modal ?? jual * 0.7) || 0;
          productMap[nama] = (productMap[nama] || 0) + qty;
          totalProfit += (jual - modal) * qty;
        });
      });

      const arr = Object.entries(productMap).map(([nama, qty]) => ({ nama, qty }));
      setProdukTerjual(arr);
      setProdukTerlaris(arr.sort((a, b) => b.qty - a.qty)[0] ?? null);
      setProfit(totalProfit);

      generateChartData(filtered);
    } catch (err) {
      console.error("Fetch transaksi failed:", err);
      Alert.alert("Error", "Gagal mengambil data transaksi.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // parse created_at which can be Firestore Timestamp, ISO string or Date
  const parseDate = (raw: any): Date | null => {
    try {
      if (!raw) return null;
      if (typeof raw === "object" && typeof raw.toDate === "function") {
        return raw.toDate();
      }
      if (typeof raw === "string") {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return d;
      }
      if (raw instanceof Date) return raw;
      if (typeof raw === "number") return new Date(raw);
      return null;
    } catch {
      return null;
    }
  };

  const generateChartData = (data: TransaksiItem[]) => {
    const grouped: { [key: string]: number } = {};

    data.forEach((item) => {
      const date = parseDate(item.created_at) ?? new Date();
      let key = "";
      if (periode === "hari") {
        key = date.toLocaleDateString("id-ID");
      } else if (periode === "bulan") {
        key = date.toLocaleString("id-ID", { month: "short", year: "numeric" });
      } else if (periode === "tahun") {
        key = date.getFullYear().toString();
      } else {
        key = date.toLocaleDateString("id-ID");
      }
      grouped[key] = (grouped[key] || 0) + (Number(item.total ?? item.diterima ?? 0) || 0);
    });

    const keys = Object.keys(grouped);
    let sortedKeys = keys.slice();
    try {
      sortedKeys = keys.sort((a, b) => {
        const da = new Date(a);
        const db = new Date(b);
        if (!isNaN(da.getTime()) && !isNaN(db.getTime())) return da.getTime() - db.getTime();
        return a.localeCompare(b);
      });
    } catch {
      sortedKeys = keys;
    }

    const values = sortedKeys.map((k) => grouped[k]);
    setChartData({ labels: sortedKeys, datasets: [{ data: values }] });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openDatePicker = (mode: "start" | "end") => {
    setShowDatePicker({ mode, visible: true });
  };

  const onDateChange = (event: any, selected?: Date) => {
    setShowDatePicker({ mode: null, visible: false });
    if (!selected) return;
    if (showDatePicker.mode === "start") {
      setRangeStart(selected);
    } else if (showDatePicker.mode === "end") {
      setRangeEnd(selected);
    }
  };

  const resetRange = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setPeriode("bulan");
  };

  const formatIDR = (val: number) => {
    try {
      return val.toLocaleString("id-ID");
    } catch {
      return String(val);
    }
  };

  // ------------------ Export CSV ------------------
  const exportCSV = async () => {
    if (!transaksi || transaksi.length === 0) {
      Alert.alert("Export CSV", "Tidak ada data untuk diekspor.");
      return;
    }

    setExporting(true);
    try {
      // build CSV header
      const headers = ["id", "tanggal", "total", "terima", "items_count"];
      const rows = transaksi.map((t) => {
        const date = parseDate(t.created_at);
        const tanggal = date ? date.toISOString() : "";
        const total = Number(t.total ?? t.diterima ?? 0);
        const itemsCount = (t.pesanan || []).length;
        // escape commas in fields if necessary
        return [t.id, `"${tanggal}"`, `${total}`, `${Number(t.diterima ?? 0)}`, `${itemsCount}`].join(",");
      });

      const csvString = [headers.join(","), ...rows].join("\n");

      const filename = `transaksi_${Date.now()}.csv`;
      const filepath = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(filepath, csvString, { encoding: FileSystem.EncodingType.UTF8 });

      // share
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Export CSV", "Fitur sharing tidak tersedia di perangkat ini.");
        setExporting(false);
        return;
      }

      await Sharing.shareAsync(filepath, {
        mimeType: "text/csv",
        dialogTitle: "Export Transaksi (CSV)",
        UTI: "public.comma-separated-values-text",
      });
    } catch (err) {
      console.error("Export CSV failed:", err);
      Alert.alert("Export CSV", "Gagal mengekspor CSV.");
    } finally {
      setExporting(false);
    }
  };

  // ------------------ Export PDF (basic via expo-print) ------------------
  const exportPDF = async () => {
    if (!transaksi || transaksi.length === 0) {
      Alert.alert("Export PDF", "Tidak ada data untuk diekspor.");
      return;
    }

    setExporting(true);
    try {
      // build simple HTML: header + summary + small table (top 20 items)
      const rowsHtml = transaksi
        .slice(0, 100) // limit rows for performance
        .map((t) => {
          const date = parseDate(t.created_at);
          const tanggal = date ? date.toLocaleString("id-ID") : "";
          const total = Number(t.total ?? t.diterima ?? 0);
          const items = (t.pesanan || []).map((it: any) => `${it.nama ?? it.name ?? "Produk"} x${it.qty ?? 0}`).join("; ");
          return `<tr>
                    <td style="padding:6px;border:1px solid #ddd">${t.id}</td>
                    <td style="padding:6px;border:1px solid #ddd">${tanggal}</td>
                    <td style="padding:6px;border:1px solid #ddd">Rp ${formatIDR(total)}</td>
                    <td style="padding:6px;border:1px solid #ddd">${items}</td>
                  </tr>`;
        })
        .join("");

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <style>
              body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
              h1 { color: #D32F2F; }
              table { width:100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
              th { text-align:left; padding:8px; background:#f7f7f7; border:1px solid #eee; }
              td { padding:6px; border:1px solid #eee; vertical-align: top; }
              .summary { margin-top: 8px; }
              .two { display:flex; gap:12px; }
              .card { padding:8px; border-radius:8px; border:1px solid #eee; background:#fafafa; }
            </style>
          </head>
          <body>
            <h1>Report Transaksi</h1>
            <div class="summary">
              <div class="two">
                <div class="card"><strong>Total Omzet</strong><div>Rp ${formatIDR(omzet)}</div></div>
                <div class="card"><strong>Profit</strong><div>Rp ${formatIDR(profit)}</div></div>
                <div class="card"><strong>Transaksi</strong><div>${jumlahTransaksi}</div></div>
              </div>
            </div>

            <h3 style="margin-top:18px">Daftar Transaksi (sample)</h3>
            <table>
              <thead><tr><th>ID</th><th>Tanggal</th><th>Total</th><th>Items</th></tr></thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <p style="font-size:11px;color:#666;margin-top:12px">Generated: ${new Date().toLocaleString()}</p>
          </body>
        </html>
      `;

      // print to file
      const { uri } = await Print.printToFileAsync({ html });
      if (!uri) throw new Error("Failed generating PDF");

      // share
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Export PDF", "Fitur sharing tidak tersedia di perangkat ini.");
        setExporting(false);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Export Transaksi (PDF)",
        UTI: "com.adobe.pdf",
      });
    } catch (err) {
      console.error("Export PDF failed:", err);
      Alert.alert("Export PDF", "Gagal mengekspor PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header (putih premium) + export icons (Style C) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/reports")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Laporan Penjualan</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={exportCSV} style={styles.iconBtn} accessibilityLabel="Export CSV" disabled={exporting}>
            {exporting ? <ActivityIndicator size="small" color="#D32F2F" /> : <MaterialIcons name="file-download" size={20} color="#111" />}
          </TouchableOpacity>

          <TouchableOpacity onPress={exportPDF} style={[styles.iconBtn, { marginLeft: 8 }]} accessibilityLabel="Export PDF" disabled={exporting}>
            {exporting ? <ActivityIndicator size="small" color="#D32F2F" /> : <MaterialIcons name="picture-as-pdf" size={20} color="#111" />}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D32F2F" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
          {/* Period + quick info */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <BlurView intensity={40} tint="light" style={styles.glassCard}>
              <View style={styles.periodContainer}>
                {["hari", "bulan", "tahun", "range"].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.periodBtn, periode === p && styles.activePeriod]}
                    onPress={() => {
                      setPeriode(p as any);
                      if (p === "range") setShowRangeModal(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.periodText, periode === p && styles.activePeriodText]}>{p === "range" ? "Custom Range" : p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.periodSubtitle}>
                {periode === "hari" && "Menampilkan transaksi hari ini"}
                {periode === "bulan" && `Menampilkan: ${months[selectedMonth]} ${selectedYear}`}
                {periode === "tahun" && `Menampilkan: Tahun ${selectedYear}`}
                {periode === "range" && (rangeStart && rangeEnd ? `Range: ${rangeStart.toLocaleDateString()} — ${rangeEnd.toLocaleDateString()}` : "Pilih range tanggal")}
              </Text>
            </BlurView>
          </View>

          {/* Month/Year select (only visible when periode is bulan atau tahun) */}
          {(periode === "bulan" || periode === "tahun") && (
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <BlurView intensity={30} tint="light" style={[styles.glassCard, styles.selectRowCard]}>
                {periode === "bulan" && (
                  <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={styles.selectBox} activeOpacity={0.8}>
                    <Ionicons name="calendar-outline" size={18} color="#D32F2F" />
                    <Text style={styles.selectText}>
                      {months[selectedMonth]} {selectedYear}
                    </Text>
                  </TouchableOpacity>
                )}

                {periode === "tahun" && (
                  <View style={styles.selectRowYear}>
                    <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)} style={styles.yearBtn}>
                      <Ionicons name="chevron-back" size={18} color="#111" />
                    </TouchableOpacity>
                    <Text style={styles.yearText}>{selectedYear}</Text>
                    <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)} style={styles.yearBtn}>
                      <Ionicons name="chevron-forward" size={18} color="#111" />
                    </TouchableOpacity>
                  </View>
                )}
              </BlurView>
            </View>
          )}

          {/* Month Picker Modal (simple list) */}
          <Modal visible={showMonthPicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Pilih Bulan & Tahun</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {months.map((m, i) => (
                    <Pressable
                      key={i}
                      style={[styles.monthItem, i === selectedMonth && { backgroundColor: "rgba(211,47,47,0.06)" }]}
                      onPress={() => {
                        setSelectedMonth(i);
                        setShowMonthPicker(false);
                      }}
                    >
                      <Text style={[styles.monthText, i === selectedMonth && { color: "#D32F2F", fontWeight: "700" }]}>
                        {m} {selectedYear}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                  <TouchableOpacity onPress={() => setShowMonthPicker(false)} style={styles.modalCloseBtn}>
                    <Text style={{ color: "#D32F2F", fontWeight: "700" }}>Tutup</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)} style={[styles.modalCloseBtn, { backgroundColor: "#f8f8f8" }]}>
                    <Text style={{ color: "#111" }}>Tahun +</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Range Modal */}
          <Modal visible={showRangeModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Pilih Range Tanggal</Text>

                <View style={{ marginVertical: 8 }}>
                  <Text style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Tanggal Mulai</Text>
                  <TouchableOpacity onPress={() => openDatePicker("start")} style={styles.rangeSelect}>
                    <Text style={{ color: rangeStart ? "#111" : "#777" }}>{rangeStart ? rangeStart.toLocaleDateString() : "Pilih tanggal mulai"}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginVertical: 8 }}>
                  <Text style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Tanggal Selesai</Text>
                  <TouchableOpacity onPress={() => openDatePicker("end")} style={styles.rangeSelect}>
                    <Text style={{ color: rangeEnd ? "#111" : "#777" }}>{rangeEnd ? rangeEnd.toLocaleDateString() : "Pilih tanggal selesai"}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      resetRange();
                      setShowRangeModal(false);
                    }}
                    style={[styles.modalCloseBtn, { backgroundColor: "#fff3f3" }]}
                  >
                    <Text style={{ color: "#D32F2F", fontWeight: "700" }}>Reset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (rangeStart && rangeEnd) {
                        setPeriode("range");
                        setShowRangeModal(false);
                      } else {
                        Alert.alert("Range", "Silakan pilih tanggal mulai dan selesai.");
                      }
                    }}
                    style={[styles.modalCloseBtn, { backgroundColor: "#D32F2F" }]}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Terapkan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* DateTimePicker for range (iOS & Android) */}
          {showDatePicker.visible && (
            <DateTimePicker
              value={showDatePicker.mode === "start" ? rangeStart ?? new Date() : rangeEnd ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(e, selected) => onDateChange(e, selected ?? undefined)}
            />
          )}

          {/* Insights */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <BlurView intensity={30} tint="light" style={styles.insightWrapper}>
              <View style={styles.insightBox}>
                <Text style={styles.insightLabel}>Total Omzet</Text>
                <Text style={styles.insightValue}>Rp {formatIDR(omzet)}</Text>
              </View>

              <View style={styles.insightBox}>
                <Text style={styles.insightLabel}>Profit</Text>
                <Text style={styles.insightValue}>Rp {formatIDR(profit)}</Text>
              </View>

              <View style={styles.insightBox}>
                <Text style={styles.insightLabel}>Transaksi</Text>
                <Text style={styles.insightValue}>{jumlahTransaksi}</Text>
              </View>
            </BlurView>
          </View>

          {/* Chart */}
          <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            <BlurView intensity={20} tint="light" style={[styles.glassCard, { paddingVertical: 12 }]}>
              <Text style={styles.sectionTitle}>Omzet Chart</Text>

              {chartData && chartData.labels.length > 0 ? (
                <LineChart
                  data={chartData}
                  width={screenWidth}
                  height={220}
                  chartConfig={{
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(211,47,47, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(34,34,34, ${opacity})`,
                    propsForDots: { r: "4", strokeWidth: "2", stroke: "#D32F2F" },
                    propsForBackgroundLines: { stroke: "#f3f3f3" },
                  }}
                  bezier
                  style={styles.chart}
                />
              ) : (
                <View style={{ paddingVertical: 36, alignItems: "center" }}>
                  <Text style={{ color: "#666" }}>Tidak ada data untuk periode ini.</Text>
                </View>
              )}
            </BlurView>
          </View>

          {/* Produk Terlaris */}
          <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            <BlurView intensity={20} tint="light" style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Produk Terlaris</Text>
              <Text style={styles.highlightText}>
                {produkTerlaris?.nama ?? "-"} ({produkTerlaris?.qty ?? 0})
              </Text>
              <View style={{ height: 10 }} />
              <Text style={{ color: "#555", marginBottom: 8, fontSize: 13 }}>Produk terjual:</Text>
              {produkTerjual.length === 0 ? (
                <Text style={{ color: "#777" }}>Belum ada data produk terjual.</Text>
              ) : (
                produkTerjual.slice(0, 6).map((p) => (
                  <View key={p.nama} style={styles.productRow}>
                    <Text style={styles.productName}>{p.nama}</Text>
                    <Text style={styles.productQty}>{p.qty}</Text>
                  </View>
                ))
              )}
            </BlurView>
          </View>

          {/* Ringkasan */}
          <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            <BlurView intensity={20} tint="light" style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Ringkasan</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Jumlah Transaksi</Text>
                <Text style={styles.summaryValue}>{jumlahTransaksi}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Produk Terjual</Text>
                <Text style={styles.summaryValue}>{produkTerjual.reduce((a, b) => a + b.qty, 0)}</Text>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      )}

      {/* small footer action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => {
            setPeriode("bulan");
            setSelectedMonth(new Date().getMonth());
            setSelectedYear(new Date().getFullYear());
            setRangeStart(null);
            setRangeEnd(null);
          }}
        >
          <Ionicons name="refresh" size={18} color="#D32F2F" />
          <Text style={styles.footerText}>Reset Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f9" },
  header: {
    height: 92,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  headerTitle: { color: "#111", fontSize: 18, fontWeight: "700" },

  headerRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 40,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  scroll: { flex: 1 },

  // glass card / general
  glassCard: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },

  // period selector
  periodContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "transparent",
    padding: 6,
    borderRadius: 28,
  },
  periodBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginHorizontal: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  activePeriod: {
    backgroundColor: "rgba(211,47,47,0.95)",
    borderColor: "rgba(211,47,47,0.95)",
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  periodText: {
    color: "#444",
    fontSize: 13,
    fontWeight: "600",
  },
  activePeriodText: {
    color: "#fff",
  },
  periodSubtitle: { textAlign: "center", marginTop: 8, fontSize: 12, color: "#666" },

  // select row
  selectRowCard: { alignItems: "center", justifyContent: "center" },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectText: { marginLeft: 8, color: "#D32F2F", fontWeight: "700" },

  // year row
  selectRowYear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  yearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  yearText: { fontWeight: "700", color: "#111", fontSize: 15 },

  // insight
  insightWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  insightBox: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  insightLabel: { fontSize: 12, color: "#555" },
  insightValue: { fontSize: 16, fontWeight: "800", color: "#D32F2F", marginTop: 6 },

  // chart
  chart: { borderRadius: 12, marginTop: 8 },

  // sections
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 6 },
  highlightText: { fontWeight: "800", fontSize: 15, color: "#D32F2F" },

  // product rows
  productRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.05)" },
  productName: { color: "#333", maxWidth: "80%" },
  productQty: { color: "#555", fontWeight: "700" },

  // summary
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
  summaryLabel: { color: "#666", fontSize: 13 },
  summaryValue: { color: "#111", fontWeight: "700" },

  // modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.36)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "86%", backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  modalTitle: { fontWeight: "800", fontSize: 16, marginBottom: 10, textAlign: "center" },
  monthItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f2f2f2" },
  monthText: { textAlign: "center", color: "#222" },
  modalCloseBtn: { alignSelf: "center", marginTop: 12, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 18, backgroundColor: "rgba(255,243,243,0.9)" },

  rangeSelect: {
    backgroundColor: "#f6f6f6",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  // small
  selectSmall: { fontSize: 13, color: "#777" },

  // footer
  footer: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  footerText: { marginLeft: 8, color: "#D32F2F", fontWeight: "700" },
});
