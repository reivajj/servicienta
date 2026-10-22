import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { argentinaDay } from '@/features/today/agenda';
import { colors } from '@/theme/colors';

export function VisitCalendar({
  value,
  onChange,
  disabled,
  allowPast = false,
}: {
  value: string;
  onChange: (day: string) => void;
  disabled: boolean;
  allowPast?: boolean;
}) {
  const today = argentinaDay(new Date());
  const [month, setMonth] = useState(() =>
    (allowPast || value >= today ? value : today).slice(0, 7),
  );
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  function move(delta: number) {
    setMonth(
      new Date(Date.UTC(year, monthNumber - 1 + delta, 1))
        .toISOString()
        .slice(0, 7),
    );
  }
  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          disabled={disabled || (!allowPast && month <= today.slice(0, 7))}
          onPress={() => move(-1)}
          style={styles.arrow}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={
              !allowPast && month <= today.slice(0, 7)
                ? colors.border
                : colors.text
            }
          />
        </Pressable>
        <Text style={styles.title}>
          {new Intl.DateTimeFormat('es-AR', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          }).format(first)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          disabled={disabled}
          onPress={() => move(1)}
          style={styles.arrow}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, index) => (
          <View key={`label-${index}`} style={styles.cell}>
            <Text style={styles.muted}>{label}</Text>
          </View>
        ))}
        {Array.from(
          { length: Math.ceil((offset + days) / 7) * 7 },
          (_, index) => {
            const number = index - offset + 1;
            if (number < 1 || number > days)
              return <View key={index} style={styles.cell} />;
            const day = `${month}-${String(number).padStart(2, '0')}`;
            const past = !allowPast && day < today;
            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={day}
                accessibilityState={{
                  selected: value === day,
                  disabled: disabled || past,
                }}
                disabled={disabled || past}
                onPress={() => onChange(day)}
                style={[styles.cell, value === day && styles.selected]}
              >
                <Text
                  style={[
                    styles.text,
                    past && styles.past,
                    day === today && styles.today,
                  ]}
                >
                  {number}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  calendar: { backgroundColor: colors.surface, borderRadius: 16, padding: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontWeight: '800', textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.285714%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  text: { color: colors.text, fontSize: 16 },
  muted: { color: colors.muted },
  past: { color: colors.border },
  today: { color: colors.accent, fontWeight: '900' },
  selected: {
    backgroundColor: 'rgba(39,180,126,0.2)',
    borderWidth: 1,
    borderColor: colors.accent,
  },
});
