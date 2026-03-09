import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function MonthPicker({ selected, onSelect }: { selected: Date; onSelect: (date: Date) => void }) {
  const [year, setYear] = useState(selected.getFullYear());

  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setYear(year - 1)}>
          <Text style={styles.nav}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{year}</Text>
        <TouchableOpacity onPress={() => setYear(year + 1)}>
          <Text style={styles.nav}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {MONTHS.map((month, index) => (
          <TouchableOpacity key={month} onPress={() => onSelect(new Date(year, index, 1))} style={[styles.monthItem, selected.getMonth() === index && selected.getFullYear() === year && styles.monthItemSelected]}>
            <Text style={[styles.monthText, selected.getMonth() === index && selected.getFullYear() === year && styles.monthTextSelected]}>{month}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  nav: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#D32F2F",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  monthItem: {
    width: "30%",
    margin: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  monthItemSelected: {
    backgroundColor: "#D32F2F",
  },
  monthText: {
    color: "#333",
    fontWeight: "500",
  },
  monthTextSelected: {
    color: "#fff",
  },
});
