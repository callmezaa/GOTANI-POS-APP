// index.tsx (revisi lengkap)
import React, { useRef, useState, useEffect } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View, ScrollView, TouchableWithoutFeedback, Image, RefreshControl, Modal, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, FontAwesome5, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import emitter from "../../lib/event";
import { RoleBlockModal } from "../../components/RoleBlockModal";
import { LinearGradient } from "expo-linear-gradient";

export default function Dashboard() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-250)).current;
  const [blockModalVisible, setBlockModalVisible] = useState(false);

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    photoURL: null as string | null,
    role: "admin" as "admin" | "karyawan",
  });
  const [isEmployee, setIsEmployee] = useState(false);

  const [transactionsCount, setTransactionsCount] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Helper: hitung total per dokumen transaksi (robust terhadap field yang berbeda)
  const calcDocTotal = (data: any) => {
    if (!data) return 0;
    if (typeof data.total === "number") return data.total;
    let t = 0;
    const arr = data.items ?? data.pesanan ?? [];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        const price = Number(it.price ?? it.harga ?? it.pricePerUnit ?? 0) || 0;
        const qty = Number(it.qty ?? it.quantity ?? it.jumlah ?? 0) || 0;
        t += price * qty;
      }
      return t;
    }
    return 0;
  };

  // 1) Dengar auth state / employee profile
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Admin logged in
        setUserInfo({
          name: user.displayName || "Admin",
          email: user.email || "-",
          photoURL: user.photoURL || null,
          role: "admin",
        });
        setIsEmployee(false);
      } else {
        // Check if employeeProfile exists in AsyncStorage (login manual)
        const stored = await AsyncStorage.getItem("employeeProfile");
        if (stored) {
          try {
            const profile = JSON.parse(stored);
            setUserInfo({
              name: profile.name || "Karyawan",
              email: "-",
              photoURL: profile.photoUrl || null,
              role: profile.role || "karyawan",
            });
            setIsEmployee(true);
          } catch {
            setUserInfo((prev) => ({ ...prev, role: "karyawan" }));
            setIsEmployee(true);
          }
        } else {
          // neither admin nor employee; show default
          setUserInfo({
            name: "",
            email: "",
            photoURL: null,
            role: "admin",
          });
          setIsEmployee(false);
        }
      }
    });

    return () => unsub();
  }, []);

  // 2) Listen profile updates (existing emitter)
  useEffect(() => {
    const listener = async () => {
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        setUserInfo((prev) => ({
          ...prev,
          name: currentUser.displayName || prev.name,
          email: currentUser.email || prev.email,
          photoURL: currentUser.photoURL || prev.photoURL,
        }));
      } else {
        // update from AsyncStorage if employee updated profile
        const stored = await AsyncStorage.getItem("employeeProfile");
        if (stored) {
          try {
            const profile = JSON.parse(stored);
            setUserInfo((prev) => ({
              ...prev,
              name: profile.name || prev.name,
              photoURL: profile.photoUrl || prev.photoURL,
            }));
          } catch {}
        }
      }
    };

    emitter.on("profile-updated", listener);
    return () => emitter.off("profile-updated", listener);
  }, []);

  // 3) Transaction listener (admin OR employee)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupAdminListener = () => {
      const user = getAuth().currentUser;
      if (!user) return;
      unsubscribe = onSnapshot(
        collection(db, `users/${user.uid}/transaksi`),
        (snapshot) => {
          if (!mounted) return;
          let total = 0;
          snapshot.forEach((doc) => {
            total += calcDocTotal(doc.data());
          });
          setTransactionsCount(snapshot.size);
          setTotalIncome(total);
        },
        (err) => {
          console.error("Listener admin transaksi error:", err);
        }
      );
    };

    const setupEmployeeListener = async () => {
      const stored = await AsyncStorage.getItem("employeeProfile");
      if (!stored) {
        // Tidak ada profile employee, kosongkan
        setTransactionsCount(0);
        setTotalIncome(0);
        return;
      }
      try {
        const profile = JSON.parse(stored);
        const adminUid = profile.adminUid ?? profile.adminId ?? null;
        const employeeId = profile.id ?? profile.employeeId ?? null;
        if (!adminUid || !employeeId) {
          setTransactionsCount(0);
          setTotalIncome(0);
          return;
        }

        unsubscribe = onSnapshot(
          collection(db, `users/${adminUid}/employees/${employeeId}/transaksi`),
          (snapshot) => {
            if (!mounted) return;
            let total = 0;
            snapshot.forEach((doc) => {
              total += calcDocTotal(doc.data());
            });
            setTransactionsCount(snapshot.size);
            setTotalIncome(total);
          },
          (err) => {
            console.error("Listener employee transaksi error:", err);
          }
        );
      } catch (e) {
        console.error("parse employeeProfile error:", e);
      }
    };

    // Clear counters while switching
    setTransactionsCount(0);
    setTotalIncome(0);

    if (isEmployee) {
      setupEmployeeListener();
    } else {
      setupAdminListener();
    }

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isEmployee]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(drawerAnim, {
        toValue: -250,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("employeeProfile");
      const auth = getAuth();
      if (!isEmployee) await signOut(auth);
      router.replace("/auth/login");
    } catch (err) {
      console.error("Logout gagal:", err);
    }
  };

  const handleAccess = (to: string, adminOnly?: boolean) => {
    if (isEmployee && adminOnly) {
      setBlockModalVisible(true);
    } else {
      router.push(to as any);
    }
  };

  const menuItems = [
    { icon: "inventory", label: "Kelola Produk", to: "/add-product", lib: MaterialIcons, adminOnly: true },
    { icon: "trending-up-outline", label: "Riwayat Transaksi", to: "/transaction-history", lib: Ionicons },
    { icon: "chart-bar", label: "Laporan", to: "/reports", lib: FontAwesome5, adminOnly: true },
    { icon: "store", label: "Stok", to: "/stock-management", lib: MaterialIcons, adminOnly: true },
    { icon: "settings-outline", label: "Pengaturan", to: "/settings", lib: Ionicons },
    { icon: "chatbubble-ellipses-outline", label: "Saran", to: "/feedback", lib: Ionicons },
    { icon: "people-outline", label: "Kelola Karyawan", to: "/employees", lib: Ionicons, adminOnly: true },
    { icon: "archive-outline", label: "Stok Karyawan", to: "/stok-karyawan", lib: Ionicons },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.iconButton}>
            <Ionicons name="menu" size={26} color="#D32F2F" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Beranda</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#D32F2F" />
          </TouchableOpacity>
        </View>

        {/* Insight Section (dengan highlight animasi lembut) */}
        <View style={styles.insightContainer}>
          <View style={[styles.insightCard, styles.highlightCard]}>
            <View style={styles.iconCircle}>
              <Ionicons name="cart-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.insightValue}>{transactionsCount}</Text>
            <Text style={styles.insightLabel}>Transaksi</Text>
          </View>

          <View style={[styles.insightCard, styles.highlightCard]}>
            <View style={styles.iconCircle}>
              <Ionicons name="cash-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.insightValue}>Rp{totalIncome.toLocaleString("id-ID")}</Text>
            <Text style={styles.insightLabel}>Pendapatan</Text>
          </View>
        </View>

        {/* Grid Menu (3 kolom) */}
        <View style={styles.gridContainer}>
          {menuItems.map((item, i) => {
            const Icon = item.lib;
            return (
              <TouchableOpacity key={i} style={styles.gridItem} activeOpacity={0.8} onPress={() => handleAccess(item.to as string, item.adminOnly)}>
                <View style={styles.gridIconWrapper}>
                  <Icon name={item.icon as any} size={22} color="#D32F2F" />
                </View>
                <Text style={styles.gridLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tombol Transaksi */}
        <TouchableOpacity style={styles.mainButton} onPress={() => router.push("/add-transaction")}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.mainButtonText}>Transaksi Baru</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Drawer */}
      {isDrawerOpen && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableWithoutFeedback onPress={toggleDrawer}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.drawerOverlay,
              {
                transform: [{ translateX: drawerAnim }],
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View style={styles.drawerContent}>
                {/* Header Profil dengan Gradient */}
                <LinearGradient colors={["#ffebee", "#fff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.drawerHeader}>
                  {userInfo.photoURL ? (
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                      <Image source={{ uri: userInfo.photoURL ?? "" }} style={styles.profileImage} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.avatarCircle}>
                      <FontAwesome name="user" size={30} color="#999" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerUsername}>{userInfo.name}</Text>
                    {!isEmployee && <Text style={styles.drawerEmail}>{userInfo.email}</Text>}
                    <Text style={styles.drawerRole}>{userInfo.role === "admin" ? "Admin" : "Karyawan"}</Text>
                  </View>
                </LinearGradient>

                <View style={styles.drawerDivider} />

                {/* Menu List */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  {menuItems.map((item, i) => {
                    const Icon = item.lib;
                    return (
                      <TouchableOpacity
                        key={i}
                        style={styles.drawerItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          toggleDrawer();
                          handleAccess(item.to as string, item.adminOnly);
                        }}
                      >
                        <Icon name={item.icon as any} size={20} color="#D32F2F" />
                        <Text style={styles.drawerItemText}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.drawerDivider} />

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                  <Text style={styles.logoutText}>Keluar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      )}

      {/* Modal Foto Profil */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" }} onPress={() => setModalVisible(false)}>
          {userInfo.photoURL && <Image source={{ uri: userInfo.photoURL }} style={{ width: "90%", height: "75%", borderRadius: 16 }} resizeMode="contain" />}
        </TouchableOpacity>
      </Modal>

      <RoleBlockModal visible={blockModalVisible} onClose={() => setBlockModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    marginTop: 50,
    marginHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
  iconButton: {
    backgroundColor: "#fff3f3",
    borderRadius: 10,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 25,
  },
  insightCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  highlightCard: {
    backgroundColor: "#D32F2F",
  },
  iconCircle: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 50,
    marginBottom: 10,
  },
  insightValue: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  insightLabel: { fontSize: 13, color: "#fff", opacity: 0.9 },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 25,
  },
  gridItem: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f1f1",
  },
  gridIconWrapper: {
    backgroundColor: "#fdeaea",
    borderRadius: 40,
    padding: 8,
    marginBottom: 8,
  },
  gridLabel: { fontSize: 12.5, color: "#333", fontWeight: "500", textAlign: "center" },
  mainButton: {
    flexDirection: "row",
    backgroundColor: "#D32F2F",
    marginHorizontal: 50,
    marginTop: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  mainButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 15,
  },

  drawerOverlay: {
    position: "absolute",
    left: 0, // geser dari kiri
    top: 0,
    bottom: 0,
    width: "75%",
    backgroundColor: "#fff",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#D32F2F",
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  drawerUsername: { fontSize: 16, fontWeight: "bold", color: "#111" },
  drawerEmail: { fontSize: 13, color: "#777" },
  drawerRole: {
    fontSize: 12,
    color: "#D32F2F",
    fontWeight: "600",
    marginTop: 2,
  },
  drawerDivider: { height: 1, backgroundColor: "#eee", marginVertical: 12 },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  drawerItemText: { fontSize: 15, color: "#333", marginLeft: 10, fontWeight: "500" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 15, marginLeft: 6 },
});
