import React from "react";
import { View, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";

export default function CalendarPicker({ selected, onSelect }: { selected: Date; onSelect: (date: Date) => void }) {
  const selectedDate = selected.toISOString().split("T")[0];

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={(day: { year: number; month: number; day: number }) => {
          const newDate = new Date(day.year, day.month - 1, day.day);
          onSelect(newDate);
        }}
        markedDates={{
          [selectedDate]: {
            selected: true,
            selectedColor: "#D32F2F",
          },
        }}
        theme={{
          arrowColor: "#D32F2F",
          todayTextColor: "#D32F2F",
          selectedDayTextColor: "#ffffff",
          textDayFontWeight: "600",
          textMonthFontWeight: "bold",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
});
