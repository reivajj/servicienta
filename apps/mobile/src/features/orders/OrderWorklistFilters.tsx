import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export type OrderView = 'main' | 'pending' | 'waiting' | 'history';
export function OrderWorklistFilters({
  value,
  counts,
  onChange,
}: {
  value: OrderView;
  counts?: { pending: number; waiting: number; history: number };
  onChange: (view: OrderView) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.row}>
        {(
          [
            {
              key: 'pending',
              label: 'Pendientes de aceptar',
              icon: 'time-outline',
            },
            {
              key: 'waiting',
              label: 'Sin completar / En espera',
              icon: 'alert-circle-outline',
            },
            { key: 'history', label: 'Historial', icon: 'archive-outline' },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: value === item.key }}
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
              ? 'Pedidos que todavía no aceptaste.'
              : value === 'waiting'
                ? 'Visitas de días anteriores sin completar, cierres por confirmar o finalizaciones rechazadas.'
                : 'Pedidos completados y cancelados, del más reciente al más antiguo.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange('main')}
            style={styles.back}
          >
            <Text style={styles.link}>Volver a la vista principal</Text>
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
  text: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1 },
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
