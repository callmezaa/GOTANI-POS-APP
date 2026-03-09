import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform, LayoutAnimation, UIManager, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";
import { Modalize } from "react-native-modalize";

import CalendarPicker from "../../components/CalendarPicker";
import MonthPicker from "../../components/MonthPicker";
import YearPicker from "../../components/YearPicker";
import TransactionCard from "../../components/TransactionCard";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransactionHistory() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<"lunas" | "belum lunas">("lunas");
  const [period, setPeriod] = useState<"harian" | "bulanan" | "tahunan">("harian");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());

  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const modalPeriodeRef = useRef<Modalize>(null);
  const modalTanggalRef = useRef<Modalize>(null);
  const [tempPeriod, setTempPeriod] = useState(period);

  const loadTransactions = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    try {
      const q = query(collection(db, `users/${user.uid}/transaksi`), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    } catch (err) {
      console.error("Gagal ambil data transaksi:", err);
    }
    setRefreshing(false);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, `users/${user.uid}/transaksi`), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    const date = selectedDate;
    const filter = transactions.filter((t) => {
      const created = t.created_at?.toDate?.();
      if (!created) return false;
      const matchSearch = t.items?.some((item: any) => item.name.toLowerCase().includes(searchText.toLowerCase()));
      const matchStatus = (t.status || "lunas") === filterType;
      const matchPeriod =
        period === "harian" ? created.toDateString() === date.toDateString() : period === "bulanan" ? created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear() : created.getFullYear() === date.getFullYear();
      return matchSearch && matchStatus && matchPeriod;
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilteredData(filter);
  }, [transactions, searchText, filterType, selectedDate, period]);
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color="#D32F2F" />
        </TouchableOpacity>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput placeholder="Cari No. Transaksi/Nama Pelanggan" placeholderTextColor="#999" style={styles.searchInput} value={searchText} onChangeText={setSearchText} />
        </View>
      </View>

      {/* Tab */}

      {/* Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity onPress={() => modalPeriodeRef.current?.open()} style={styles.filterItem}>
          <Text style={styles.filterLabel}>Periode {period.charAt(0).toUpperCase() + period.slice(1)}</Text>
          <MaterialIcons name="keyboard-arrow-up" size={20} color="#D32F2F" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setTempDate(selectedDate);
            modalTanggalRef.current?.open();
          }}
          style={styles.filterItem}
        >
          <Text style={styles.filterLabel}>
            {period === "tahunan"
              ? selectedDate.getFullYear().toString()
              : selectedDate.toLocaleDateString("id-ID", {
                  day: period === "harian" ? "2-digit" : undefined,
                  month: "long",
                  year: "numeric",
                })}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      {/* Modal Tanggal */}
      <Modalize ref={modalTanggalRef} adjustToContentHeight handlePosition="inside">
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 16 }}>Pilih {period === "harian" ? "Tanggal" : period === "bulanan" ? "Bulan" : "Tahun"}</Text>

          {period === "harian" && <CalendarPicker selected={tempDate} onSelect={setTempDate} />}
          {period === "bulanan" && <MonthPicker selected={tempDate} onSelect={setTempDate} />}
          {period === "tahunan" && <YearPicker selected={tempDate} onSelect={setTempDate} />}

          <View style={{ flexDirection: "row", marginTop: 16, gap: 10 }}>
            <TouchableOpacity
              onPress={() => modalTanggalRef.current?.close()}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#D32F2F",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text style={{ color: "#D32F2F", textAlign: "center", fontWeight: "bold" }}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSelectedDate(tempDate);
                modalTanggalRef.current?.close();
              }}
              style={{
                flex: 1,
                backgroundColor: "#D32F2F",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Pilih</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>

      {/* Modal Periode */}
      <Modalize ref={modalPeriodeRef} adjustToContentHeight handlePosition="inside">
        <View style={{ padding: 20 }}>
          {["harian", "bulanan", "tahunan"].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setTempPeriod(item as any)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: tempPeriod === item ? "#f0f4ff" : "transparent",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: tempPeriod === item ? "#D32F2F" : "#333",
                }}
              >
                Periode {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ flexDirection: "row", marginTop: 20, gap: 10 }}>
            <TouchableOpacity onPress={() => modalPeriodeRef.current?.close()} style={{ flex: 1, borderWidth: 1, borderColor: "#D32F2F", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: "#D32F2F", textAlign: "center", fontWeight: "bold" }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setPeriod(tempPeriod);
                modalPeriodeRef.current?.close();
              }}
              style={{ flex: 1, backgroundColor: "#D32F2F", borderRadius: 8, padding: 12 }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Pilih</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>

      {/* List Transaksi */}
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 30 }} />
      ) : filteredData.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 40, color: "#888" }}>Tidak ada transaksi</Text>
      ) : (
        <FlatList
          data={filteredData}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionCard item={item} onPress={() => router.push(`/detail_transactions?id=${item.id}`)} username={user?.displayName || "kasir"} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTransactions} />}
          showsVerticalScrollIndicator={false}
          bounces={true} // iOS & Android Expo SDK 48+
          overScrollMode="always" // Android: biar ada efek overscroll
          decelerationRate="fast" // Scroll lebih smooth
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 16,
  },

  // Header lebih clean dan elegan
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f4f5f7",
    borderRadius: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#222" },

  // Filter row dengan style modern
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  filterItem: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterLabel: { fontWeight: "600", color: "#333" },

  // Card style: clean, berjarak, profesional
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  cardDate: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D32F2F",
  },

  // Badge yang lebih premium
  badge: {
    backgroundColor: "#fdecea",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 11,
  },

  // Label tambahan
  madeBy: {
    fontSize: 12,
    color: "#555",
  },
  kasir: {
    color: "#D32F2F",
    fontWeight: "bold",
  },

  emptyState: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
    fontSize: 15,
  },
});
