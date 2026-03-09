import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { db } from "../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function RiwayatTransaksiKaryawan() {
  const user = getAuth().currentUser;
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("Semua");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      if (!user) return;

      const employeesSnap = await getDocs(collection(db, `users/${user.uid}/employees`));
      const employeesData = employeesSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      setEmployees(employeesData);

      let allTransactions: any[] = [];

      for (const emp of employeesData) {
        const trxSnap = await getDocs(collection(db, `users/${user.uid}/employees/${emp.id}/transaksi`));
        const empTrx = trxSnap.docs.map((t) => ({
          id: t.id,
          ...(t.data() as any),
          employeeId: emp.id,
          employeeName: emp.name || emp.nama || "Tanpa Nama",
        }));
        allTransactions = [...allTransactions, ...empTrx];
      }

      allTransactions.sort((a, b) => {
        const at = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
        const bt = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
        return bt - at;
      });

      const enriched = allTransactions.map((t) => {
        const items = t.pesanan || t.items || [];
        const processed = items.map((it: any) => ({
          name: it.name || it.nama || "Tanpa Nama",
          qty: it.qty || 0,
          price: it.price || it.harga || 0,
        }));
        const total = processed.reduce((acc: number, it: { qty: number; price: number }) => acc + it.qty * it.price, 0);
        return { ...t, _items: processed, _computedTotal: total };
      });

      setTransactions(enriched);
      setFilteredTransactions(enriched);
    } catch (err) {
      console.error("❌ Gagal ambil transaksi karyawan:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const applyFilter = (name: string) => {
    setSelectedEmployee(name);
    if (name === "Semua") setFilteredTransactions(transactions);
    else setFilteredTransactions(transactions.filter((t) => t.employeeName === name));
    setFilterVisible(false);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.trxId}>ID: {item.id}</Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={{ marginTop: 6 }}>
        <Text style={styles.employee}>Karyawan: {item.employeeName}</Text>
        {item._items?.map((it: any, i: number) => (
          <Text key={i} style={styles.item}>
            {it.name} × {it.qty} = Rp{(it.price * it.qty).toLocaleString("id-ID")}
          </Text>
        ))}
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalValue}>Rp {item._computedTotal?.toLocaleString("id-ID")}</Text>
      </View>
    </View>
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.title}>Riwayat Transaksi Karyawan</Text>
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Ionicons name="filter" size={22} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />}
          ListEmptyComponent={<Text style={styles.empty}>Belum ada transaksi</Text>}
        />
      )}

      {/* Modal Filter */}
      <Modal visible={filterVisible} transparent animationType="fade">
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Karyawan</Text>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilter("Semua")}>
              <Text style={selectedEmployee === "Semua" ? styles.activeFilterText : styles.filterText}>Semua</Text>
            </TouchableOpacity>
            {employees.map((emp) => (
              <TouchableOpacity key={emp.id} style={styles.filterOption} onPress={() => applyFilter(emp.name || emp.nama || "Tanpa Nama")}>
                <Text style={selectedEmployee === emp.name || selectedEmployee === emp.nama ? styles.activeFilterText : styles.filterText}>{emp.name || emp.nama || "Tanpa Nama"}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setFilterVisible(false)} style={styles.closeBtn}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#222", textAlign: "center", flex: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trxId: { fontSize: 13, color: "#666" },
  date: { fontSize: 12, color: "#999" },
  employee: { fontSize: 14, fontWeight: "600", color: "#D32F2F", marginBottom: 6 },
  item: { fontSize: 13, color: "#333", marginLeft: 6 },
  totalLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 8 },
  totalValue: { fontSize: 15, fontWeight: "bold", color: "#D32F2F", marginTop: 8 },
  empty: { textAlign: "center", color: "#777", marginTop: 40, fontSize: 14 },
  modalWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 12,
    padding: 20,
    elevation: 6,
  },
  modalTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  filterOption: { paddingVertical: 8 },
  filterText: { color: "#333", fontSize: 14 },
  activeFilterText: { color: "#D32F2F", fontWeight: "bold" },
  closeBtn: {
    backgroundColor: "#D32F2F",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 14,
  },
});
