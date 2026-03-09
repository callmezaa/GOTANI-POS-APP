import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Image, ActivityIndicator, Platform, LayoutAnimation, UIManager, RefreshControl } from "react-native";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import CalendarPicker from "../../../components/CalendarPicker";
import MonthPicker from "../../../components/MonthPicker";
import YearPicker from "../../../components/YearPicker";
import { useRouter } from "expo-router";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SoldProductScreen() {
  const router = useRouter();
  const [soldProducts, setSoldProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [period, setPeriod] = useState<"harian" | "bulanan" | "tahunan">("harian");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [tempPeriod, setTempPeriod] = useState(period);

  const modalPeriodeRef = useRef<Modalize>(null);
  const modalTanggalRef = useRef<Modalize>(null);

  const user = getAuth().currentUser;

  useEffect(() => {
    if (!user?.uid) return;
    fetchSoldData();
  }, [period, selectedDate]);

  const fetchSoldData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, `users/${user.uid}/transaksi`));
      const productCount: Record<string, { qty: number; imageUri: string }> = {};

      snap.forEach((doc) => {
        const data = doc.data();
        const tgl = data.created_at?.toDate?.();
        if (!tgl) return;

        const match =
          period === "harian"
            ? tgl.toDateString() === selectedDate.toDateString()
            : period === "bulanan"
            ? tgl.getMonth() === selectedDate.getMonth() && tgl.getFullYear() === selectedDate.getFullYear()
            : tgl.getFullYear() === selectedDate.getFullYear();

        if (match && Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            if (item.name && typeof item.qty === "number") {
              const key = item.name;
              productCount[key] = {
                qty: (productCount[key]?.qty || 0) + item.qty,
                imageUri: item.imageUri || "",
              };
            }
          });
        }
      });

      const hasil = Object.entries(productCount).map(([name, val]) => ({
        name,
        qty: val.qty,
        imageUri: val.imageUri,
      }));

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSoldProducts(hasil);
    } catch (err) {
      console.error("Gagal mengambil data produk terjual", err);
      Alert.alert("Error", "Gagal mengambil data produk terjual.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSoldData();
  }, []);

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/reports")}>
            <Ionicons name="arrow-back" size={24} color="#D32F2F" />
          </TouchableOpacity>
          <Text style={styles.title}>Produk Terjual</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Filter Row */}
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
                ? selectedDate.getFullYear()
                : selectedDate.toLocaleDateString("id-ID", {
                    day: period === "harian" ? "2-digit" : undefined,
                    month: "long",
                    year: "numeric",
                  })}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#D32F2F" />
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />
        ) : soldProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Produk Terjual Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>Belum ada penjualan pada periode ini</Text>
          </View>
        ) : (
          <FlatList
            data={soldProducts}
            keyExtractor={(item) => item.name}
            contentContainerStyle={{ marginTop: 20, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#000"]} />}
            alwaysBounceVertical={true}
            bounces={true}
            overScrollMode="always"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <Image source={item.imageUri ? { uri: item.imageUri } : require("../../../assets/placeholder-image.png")} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>{item.qty} Terjual</Text>
                </View>
              </View>
            )}
          />
        )}
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
            <TouchableOpacity
              onPress={() => modalPeriodeRef.current?.close()}
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
                setPeriod(tempPeriod);
                modalPeriodeRef.current?.close();
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  filterItem: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterLabel: { fontWeight: "bold", color: "#333" },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    gap: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#1f2937",
  },
  itemQty: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
});
