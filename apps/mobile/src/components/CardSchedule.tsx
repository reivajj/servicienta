import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { formatTime } from '@/lib/format';
import { colors } from '@/theme/colors';
import { AGENDA_TIME_ZONE } from '@/features/today/agenda';

export function CardSchedule({
  value,
  label,
  timeZone = AGENDA_TIME_ZONE,
}: {
  value: string | null;
  label?: string;
  timeZone?: string;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.row}>
        <Ionicons
          name="calendar-outline"
          size={16}
          style={styles.icon}
          color={colors.muted}
          accessible={false}
        />
        <Text
          style={styles.date}
          accessibilityLabel={
            label
              ? `${label}: ${value ? new Intl.DateTimeFormat('es-AR', { timeZone, dateStyle: 'medium' }).format(new Date(value)) : 'Sin fecha programada'}`
              : undefined
          }
        >
          {value
            ? new Intl.DateTimeFormat('es-AR', {
                timeZone,
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).format(new Date(value))
            : 'Sin fecha programada'}
        </Text>
      </View>
      {value ? (
        <View style={styles.row}>
          <Ionicons
            name="alarm-outline"
            size={16}
            style={styles.icon}
            color={colors.accent}
            accessible={false}
          />
          <Text style={styles.time}>{formatTime(value, timeZone)}</Text>
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  icon: { lineHeight: 22, includeFontPadding: false, textAlign: 'center' },
  date: {
    flexShrink: 1,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
    fontWeight: '600',
  },
  time: {
    flexShrink: 1,
    color: colors.accent,
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
