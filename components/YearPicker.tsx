import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function YearPicker({ selected, onSelect }: { selected: Date; onSelect: (date: Date) => void }) {
  const [tempYear, setTempYear] = useState(selected.getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {years.map((year) => {
        const isSelected = year === tempYear;
        return (
          <TouchableOpacity key={year} onPress={() => setTempYear(year)} style={[styles.yearItem, isSelected && styles.selectedItem]}>
            <Text style={[styles.yearText, isSelected && styles.selectedText]}>{year}</Text>
          </TouchableOpacity>
        );
      })}

      {/* Tombol bisa kamu pindah ke luar komponen ini juga */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingBottom: 100,
  },
  yearItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  selectedItem: {
    backgroundColor: "#f3f4f6",
  },
  yearText: {
    fontSize: 18,
    color: "#111",
  },
  selectedText: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderColor: "#D32F2F",
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelText: {
    color: "#D32F2F",
    textAlign: "center",
    fontWeight: "bold",
  },
  okButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#D32F2F",
    borderRadius: 8,
  },
  okText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
