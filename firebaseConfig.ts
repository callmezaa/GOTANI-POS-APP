// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDBhVN1c6I-mQuiN9fxx1QRS6lbTjktoqs",
  authDomain: "kasir-app.firebaseapp.com",
  projectId: "kasir-app-afec0",
  storageBucket: "kasir-app-afec0.firebasestorage.app",
  messagingSenderId: "501369925087",
  appId: "1:501369925087:android:4f04df032a0b6688cfe86a",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);

export { auth };
