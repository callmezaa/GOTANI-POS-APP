import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { getDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";

interface Item {
  name: string;
  qty: number;
  price: number;
}

export default function DetailTransaksi() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transaksi, setTransaksi] = useState<any>(null);

  const auth = getAuth();
  const user = auth.currentUser;

  const ambilDetail = async () => {
    if (!user?.uid || !id) return;

    try {
      const ref = doc(db, `users/${user.uid}/transaksi`, id as string);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setTransaksi(snap.data());
      } else {
        Alert.alert("Info", "Transaksi tidak ditemukan");
      }
    } catch (err) {
      Alert.alert("Error", "Gagal memuat detail transaksi");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    ambilDetail();
  }, [id, user?.uid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    ambilDetail();
  }, [user?.uid, id]);

  const handleDelete = async () => {
    if (!user?.uid || !id) return;

    Alert.alert("Hapus Transaksi", "Yakin ingin menghapus transaksi ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, `users/${user.uid}/transaksi`, id as string));
          Alert.alert("Berhasil", "Transaksi dihapus");
          router.replace("/transaction-history");
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  if (!transaksi) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#999" }}>Data tidak ditemukan</Text>
      </View>
    );
  }

  const created = transaksi.created_at?.toDate?.();
  const tanggal = created
    ? created.toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const items = Array.isArray(transaksi.items) ? transaksi.items : [];
  const diterima = transaksi.diterima || 0;
  const total = transaksi.total || 0;
  const kembalian = transaksi.kembalian || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/transaction-history")}>
          <Ionicons name="arrow-back" size={24} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Transaksi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#000"]} />}
        alwaysBounceVertical={true} // efek bounce
        bounces={true}
        overScrollMode="always" // Android overscroll
      >
        {/* Rincian Transaksi */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Rincian Transaksi</Text>
            <Text style={styles.boldText}>Dibuat oleh {user?.displayName || transaksi.kasir || "Kasir"}</Text>
          </View>
          <Text style={styles.infoText}>Pembayaran: {transaksi.metode || "Tunai"}</Text>
          <Text style={styles.infoText}>Tanggal: {tanggal}</Text>
        </View>

        {/* Pesanan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pesanan</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 2 }]}>Nama Barang</Text>
            <Text style={styles.cell}>Jumlah</Text>
            <Text style={[styles.cell, { textAlign: "right" }]}>Harga</Text>
          </View>

          {items.map((item: Item, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 2 }]}>{item.name}</Text>
              <Text style={styles.cell}>x{item.qty}</Text>
              <Text style={[styles.cell, { textAlign: "right" }]}>Rp{(item.qty * item.price).toLocaleString("id-ID")}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Pesanan</Text>
            <Text style={styles.totalValue}>Rp{total.toLocaleString("id-ID")}</Text>
          </View>
        </View>

        {/* Ringkasan Total */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>Rp{total.toLocaleString("id-ID")}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Diterima</Text>
            <Text style={styles.summaryValue}>Rp{diterima.toLocaleString("id-ID")}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kembali</Text>
            <Text style={styles.summaryValue}>Rp{kembalian.toLocaleString("id-ID")}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Tombol Hapus */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash" size={22} color="#fff" />
        <Text style={styles.deleteText}>Hapus Transaksi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  scroll: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#222",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  boldText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#D32F2F",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  totalRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#444",
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#D32F2F",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#333",
  },
  summaryValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    gap: 8,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
