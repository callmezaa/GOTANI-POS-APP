import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        console.log("isLoggedIn:", isLoggedIn); // Debugging log
        if (isLoggedIn === "true") {
          router.replace("/(tabs)"); // Arahkan ke dashboard jika sudah login
        } else {
          router.replace("/auth/login"); // Arahkan ke login jika belum login
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        router.replace("/auth/login"); // Default ke login jika ada error
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Qasir App</Text>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#191970", // Midnight Blue
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    color: "#ffffff",
    marginBottom: 20,
  },
});
