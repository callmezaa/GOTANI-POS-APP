import React, { createContext, useContext, useState, ReactNode } from "react";

type Employee = {
  id: string;
  name: string;
  username: string;
  role: string;
  photoUrl?: string;
};

type EmployeeContextType = {
  employee: Employee | null;
  setEmployee: (employee: Employee | null) => void;
};

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);

  return <EmployeeContext.Provider value={{ employee, setEmployee }}>{children}</EmployeeContext.Provider>;
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (!context) throw new Error("useEmployee must be used within EmployeeProvider");
  return context;
}
