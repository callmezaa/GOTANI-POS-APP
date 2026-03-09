import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { UserProvider } from "../../contexts/UserContext"; // pastikan path ini benar

export default function TabsLayout() {
  return (
    <UserProvider>
      <Tabs
        screenOptions={{
          headerShown: false, // ❌ Sembunyikan semua header title/tab title
        }}
      >
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="add-product" options={{ href: null }} />
        <Tabs.Screen name="add-transaction" options={{ href: null }} />
        <Tabs.Screen name="AddCategoryForm" options={{ href: null }} />
        <Tabs.Screen name="AddProductForm" options={{ href: null }} />
        <Tabs.Screen name="employees" options={{ href: null }} />
        <Tabs.Screen name="feedback" options={{ href: null }} />
        <Tabs.Screen name="reports" options={{ href: null }} />
        <Tabs.Screen name="scan-qr" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="stock-management" options={{ href: null }} />
        <Tabs.Screen name="transaction-history" options={{ href: null }} />
        <Tabs.Screen name="laporan/omzet-per-bulan" options={{ href: null }} />
        <Tabs.Screen name="laporan/produk-terjual" options={{ href: null }} />
        <Tabs.Screen name="laporan/produk-terlaris" options={{ href: null }} />
        <Tabs.Screen name="laporan/transaksi-penjualan" options={{ href: null }} />
        <Tabs.Screen name="pengaturan/profil" options={{ href: null }} />
        <Tabs.Screen name="pengaturan/struk" options={{ href: null }} />
        <Tabs.Screen name="pengaturan/ubah-password" options={{ href: null }} />
        <Tabs.Screen name="pengaturan/warung" options={{ href: null }} />
        <Tabs.Screen name="pengaturan/notifikasi" options={{ href: null }} />
        <Tabs.Screen name="EditProductForm" options={{ href: null }} />
        <Tabs.Screen name="pembayaran" options={{ href: null }} />
        <Tabs.Screen name="payment/cash" options={{ href: null }} />
        <Tabs.Screen name="kirim-struk" options={{ href: null }} />
        <Tabs.Screen name="transaksi-berhasil" options={{ href: null }} />
        <Tabs.Screen name="detail_transactions" options={{ href: null }} />
        <Tabs.Screen name="payment/online" options={{ href: null }} />
        <Tabs.Screen name="payment/success" options={{ href: null }} />
        <Tabs.Screen name="stock-distribution" options={{ href: null }} />
        <Tabs.Screen name="karyawan/add-employees" options={{ href: null }} />
        <Tabs.Screen name="karyawan/edit-employees" options={{ href: null }} />
        <Tabs.Screen name="karyawan/profil" options={{ href: null }} />
        <Tabs.Screen name="stok-karyawan" options={{ href: null }} />
        <Tabs.Screen name="stock/kelola" options={{ href: null }} />
        <Tabs.Screen name="stock/pembagian" options={{ href: null }} />
        <Tabs.Screen name="stock/supplier" options={{ href: null }} />
        <Tabs.Screen name="stok-karyawan-detail" options={{ href: null }} />
        <Tabs.Screen name="supplier-riwayat" options={{ href: null }} />
        <Tabs.Screen name="stock/edit-stok" options={{ href: null }} />
        <Tabs.Screen name="stock/detail-stok" options={{ href: null }} />
        <Tabs.Screen name="laporan/riwayat-transaksi-karyawan" options={{ href: null }} />
        <Tabs.Screen name="payment/confirm" options={{ href: null }} />
      </Tabs>
    </UserProvider>
  );
}
