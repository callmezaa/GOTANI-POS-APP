import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

type Role = "admin" | "karyawan" | null;

type EmployeeData = {
  id: string;
  name: string;
  username: string;
  photoUrl?: string;
};

type UserContextType = {
  role: Role;
  loading: boolean;
  employee: EmployeeData | null;
  uid: string | null;
};

const UserContext = createContext<UserContextType>({
  role: null,
  loading: true,
  employee: null,
  uid: null,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          // 🔑 Admin login
          const userData = userDoc.data();
          setRole(userData.role || "admin");
          setEmployee(null); // Admin tidak perlu employee data
          setUid(user.uid);
        } else {
          // 🔑 Karyawan login → Cari di semua akun admin
          const adminsSnap = await getDoc(doc(db, "admins", "index"));
          const adminUIDs = adminsSnap.exists() ? adminsSnap.data().uids || [] : [];

          let found = false;
          for (const adminUid of adminUIDs) {
            const empSnap = await getDoc(doc(db, `users/${adminUid}/employees`, user.uid));
            if (empSnap.exists()) {
              const empData = empSnap.data();
              setRole("karyawan");
              setEmployee({ id: empSnap.id, name: empData.name, username: empData.username, photoUrl: empData.photoUrl });
              setUid(user.uid);
              found = true;
              break;
            }
          }

          if (!found) {
            setRole(null);
            setEmployee(null);
          }
        }
      } else {
        setRole(null);
        setEmployee(null);
        setUid(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <UserContext.Provider value={{ role, loading, employee, uid }}>{children}</UserContext.Provider>;
};
