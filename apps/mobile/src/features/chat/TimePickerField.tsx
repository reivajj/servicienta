import { createElement } from 'react';
import type { ChangeEvent } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { OPERATION_SCHEDULE_STEP_MINUTES } from '@servicienta/types';
import { colors } from '@/theme/colors';

export interface TimePickerFieldProps {
  day: string;
  value: string;
  onChange: (time: string) => void;
  disabled: boolean;
}

// Metro uses TimePickerField.native.tsx on Android/iOS.
export function TimePickerField({
  value,
  onChange,
  disabled,
}: TimePickerFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        Hora de Argentina · cada {OPERATION_SCHEDULE_STEP_MINUTES} minutos
      </Text>
      <Text style={styles.label}>{value ? `${value}hs` : 'Sin horario'}</Text>
      {createElement('input', {
        type: 'time',
        'aria-label': 'Hora de visita',
        value,
        disabled,
        step: OPERATION_SCHEDULE_STEP_MINUTES * 60,
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value),
        style: {
          minHeight: 52,
          padding: 12,
          borderRadius: 14,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          color: colors.text,
          fontSize: 24,
          colorScheme: 'dark',
          boxSizing: 'border-box',
          width: '100%',
        },
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.muted, lineHeight: 22 },
});
