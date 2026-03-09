import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function KirimStruk() {
  const { items, total, diterima, kembalian } = useLocalSearchParams();

  const [pesanan, setPesanan] = useState<any[]>([]);
  const [kasir, setKasir] = useState("Kasir");
  const [pengaturan] = useState({
    tampilkan_logo: true,
    tampilkan_catatan: true,
  });

  useEffect(() => {
    if (items) {
      try {
        setPesanan(JSON.parse(items as string));
      } catch (e) {
        Alert.alert("Gagal memuat data pesanan");
      }
    }
  }, [items]);

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // 1. Coba ambil dari user utama
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.name) {
            setKasir(data.name);
            return;
          }
        }

        // 2. Kalau tidak ada, coba ambil dari karyawan
        const empRef = doc(db, `users/${user.uid}/employees`, user.uid);
        const empSnap = await getDoc(empRef);
        if (empSnap.exists()) {
          const data = empSnap.data();
          if (data.name) {
            setKasir(data.name);
            return;
          }
        }

        setKasir("Kasir");
      } catch (err) {
        console.error("Gagal mengambil data user:", err);
      }
    };

    fetchUserName();
  }, []);

  const handleShareStruk = async () => {
    try {
      const strukText = generateStrukText({
        kasir,
        pesanan,
        total: Number(total),
        diterima: Number(diterima),
        kembalian: Number(kembalian),
        pengaturan,
      });

      const fileUri = FileSystem.documentDirectory + "struk.txt";
      await FileSystem.writeAsStringAsync(fileUri, strukText, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Bagikan Struk",
        mimeType: "text/plain",
        UTI: "public.plain-text",
      });
    } catch (err) {
      Alert.alert("Gagal membagikan struk.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaksi Berhasil</Text>
      <TouchableOpacity style={styles.button} onPress={handleShareStruk}>
        <Ionicons name="print" size={20} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.buttonText}>Cetak / Kirim Struk</Text>
      </TouchableOpacity>
    </View>
  );
}

function generateStrukText({
  kasir,
  pesanan,
  total,
  diterima,
  kembalian,
  pengaturan,
}: {
  kasir: string;
  pesanan: any[];
  total: number;
  diterima: number;
  kembalian: number;
  pengaturan: { tampilkan_logo: boolean; tampilkan_catatan: boolean };
}) {
  const width = 32;
  const divider = "-".repeat(width);
  const center = (text: string) => {
    const space = Math.floor((width - text.length) / 2);
    return " ".repeat(Math.max(space, 0)) + text;
  };

  const tanggal = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let struk = "";

  if (pengaturan.tampilkan_logo) {
    struk += center("TOKO KASIRKU") + "\n";
    struk += center("Jl. Sukamaju No. 123") + "\n";
    struk += center("0812-3456-7890") + "\n";
  }

  struk += divider + "\n";
  struk += `Kasir     : ${kasir}\n`;
  struk += `Tanggal   : ${tanggal}\n`;
  struk += `No. Struk : #${Math.floor(Math.random() * 900000 + 100000)}\n`;
  struk += `Bayar Via : Tunai\n`;
  struk += divider + "\n";

  struk += "Nama        Qty  Harga   Subtotal\n";
  struk += divider + "\n";

  pesanan.forEach((item) => {
    const nama = item.name.length > 11 ? item.name.slice(0, 11) : item.name.padEnd(11);
    const qty = item.qty.toString().padStart(3);
    const harga = item.price.toLocaleString("id-ID").padStart(7);
    const subtotal = (item.price * item.qty).toLocaleString("id-ID").padStart(9);
    struk += `${nama} ${qty} ${harga} ${subtotal}\n`;
  });

  struk += divider + "\n";
  const formatLine = (label: string, value: number) => `${label.padEnd(10)} : Rp${value.toLocaleString("id-ID").padStart(12)}`;

  struk += formatLine("TOTAL", total) + "\n";
  struk += formatLine("DIBAYAR", diterima) + "\n";
  struk += formatLine("KEMBALI", kembalian) + "\n";
  struk += divider + "\n";

  if (pengaturan.tampilkan_catatan) {
    struk += center("Terima kasih") + "\n";
    struk += center("telah berbelanja!") + "\n";
  }

  struk += "\n\n";

  return struk;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#D32F2F",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
