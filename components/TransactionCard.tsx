import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function TransactionCard({ item, onPress, username }: { item: any; onPress: () => void; username: string }) {
  const created = item.created_at?.toDate?.() || new Date();
  const total = Array.isArray(item.items) ? item.items.reduce((acc: number, i: any) => acc + i.price * i.qty, 0) : 0;

  const timeFormatted = created
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/:/g, ".");

  return (
    <TouchableOpacity onPress={onPress} style={styles.transCard}>
      {/* Kolom kiri tanggal */}
      <View style={styles.transDateBox}>
        <Text style={styles.transDay}>{created.getDate().toString().padStart(2, "0")}</Text>
        <Text style={styles.transMonth}>
          {created.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} {created.getFullYear()}
        </Text>
        <Text style={styles.transTime}>{timeFormatted}</Text>
      </View>

      {/* Kolom kanan isi transaksi */}
      <View style={styles.transContent}>
        <View style={styles.rowBetween}>
          <Text style={styles.transCode}>{item.kode || item.id}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>TUNAI</Text>
          </View>
        </View>

        <Text style={styles.transTotal}>Rp{total.toLocaleString("id-ID")}</Text>

        <View style={styles.madeByWrapper}>
          <Text style={styles.madeBy}>
            Dibuat oleh <Text style={styles.kasir}>{username}</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  transCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 5,
    alignItems: "flex-start",
  },
  transDateBox: {
    backgroundColor: "#FFD700",
    borderRadius: 10,
    padding: 5,
    alignItems: "center",
    width: 60,
  },
  transDay: {
    fontSize: 20,
    fontWeight: "900",
    color: "#222",
  },
  transMonth: {
    fontSize: 12,
    color: "#222",
    marginTop: 2,
  },
  transTime: {
    fontSize: 12,
    color: "#222",
    marginTop: 2,
  },
  transContent: {
    flex: 1,
    paddingLeft: 15,
    justifyContent: "space-between",
    minHeight: 50,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  transCode: {
    fontSize: 12,
    fontWeight: "500",
    color: "#222",
    flexShrink: 1,
    flex: 1,
    paddingRight: 12,
  },
  transTotal: {
    fontSize: 17,
    fontWeight: "bold",
    color: "green",
    marginTop: 13,
  },
  badge: {
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#D32F2F",
    fontWeight: "bold",
    fontSize: 10,
  },
  madeByWrapper: {
    marginTop: 2,
    alignItems: "flex-end",
  },
  madeBy: {
    fontSize: 10,
    color: "#333",
    textAlign: "right",
  },
  kasir: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
});
