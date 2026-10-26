import { ActionLabel } from '@/components/ActionLabel';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export type VisitView = 'main' | 'pending' | 'overdue';
export function VisitAttentionFilters({
  value,
  counts,
  onChange,
}: {
  value: VisitView;
  counts?: { pending: number; overdue: number };
  onChange: (view: VisitView) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.row}>
        {(
          [
            { key: 'pending', label: 'Pendientes', icon: 'time-outline' },
            {
              key: 'overdue',
              label: 'Sin completar',
              icon: 'alert-circle-outline',
            },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: value === item.key }}
            accessibilityLabel={`${item.label}: ${counts?.[item.key] ?? 'cargando'}`}
            onPress={() => onChange(value === item.key ? 'main' : item.key)}
            style={[
              styles.button,
              item.key === 'pending' && styles.warning,
              value === item.key && styles.selected,
            ]}
          >
            <Ionicons
              name={item.icon}
              size={18}
              color={item.key === 'pending' ? '#dfbc75' : colors.accent}
              accessible={false}
            />
            <Text
              style={[
                styles.text,
                item.key === 'pending' && styles.warningText,
              ]}
            >
              {item.label}
            </Text>
            <Text
              style={[
                styles.count,
                item.key === 'pending' && styles.warningText,
              ]}
            >
              {counts?.[item.key] ?? '—'}
            </Text>
          </Pressable>
        ))}
      </View>
      {value !== 'main' ? (
        <>
          <Text style={styles.copy}>
            {value === 'pending'
              ? 'Visitas pendientes de agenda. Las más antiguas aparecen primero.'
              : 'Visitas que siguen agendadas con fecha anterior a hoy.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange('main')}
            style={styles.back}
          >
            <ActionLabel icon="arrow-back-outline" textStyle={styles.link}>
              Volver a la vista principal
            </ActionLabel>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  warning: {
    backgroundColor: 'rgba(223,188,117,0.08)',
    borderColor: 'rgba(223,188,117,0.3)',
  },
  selected: { borderColor: colors.accent, borderWidth: 2 },
  text: { color: colors.text, fontSize: 14, fontWeight: '600' },
  count: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  warningText: { color: '#dfbc75' },
  copy: { color: colors.muted, lineHeight: 21 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  link: { color: colors.accent, fontWeight: '700' },
});
