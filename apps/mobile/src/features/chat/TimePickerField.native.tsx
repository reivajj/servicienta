import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { OPERATION_SCHEDULE_STEP_MINUTES } from '@servicienta/types';
import { AGENDA_TIME_ZONE } from '@/features/today/agenda';
import { colors } from '@/theme/colors';
import { scheduleFields } from './schedule';
import type { TimePickerFieldProps } from './TimePickerField';

export function TimePickerField({
  day,
  value,
  onChange,
  disabled,
}: TimePickerFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(new Date());
  const [error, setError] = useState('');

  function open() {
    const date = new Date(`${day}T${value}:00-03:00`);
    if (!Number.isFinite(date.getTime())) {
      setError('Elegí una fecha válida.');
      return;
    }
    setError('');
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'time',
        display: 'clock',
        is24Hour: true,
        minuteInterval: OPERATION_SCHEDULE_STEP_MINUTES,
        timeZoneName: AGENDA_TIME_ZONE,
        positiveButton: { label: 'Confirmar', textColor: colors.accent },
        negativeButton: { label: 'Cancelar' },
        onValueChange: (_event, selected) =>
          onChange(scheduleFields(selected.toISOString()).time),
        onError: () =>
          setError('No pudimos abrir el reloj. Volvé a intentarlo.'),
      });
    } else {
      setDraft(date);
      setExpanded(true);
    }
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        Hora de Argentina · cada {OPERATION_SCHEDULE_STEP_MINUTES} minutos
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Elegir hora de visita, ${value}hs`}
        disabled={disabled}
        onPress={open}
        style={[styles.trigger, disabled && styles.disabled]}
      >
        <Ionicons name="time-outline" size={26} color={colors.accent} />
        <Text style={styles.time}>{value}hs</Text>
        <Ionicons name="chevron-down" size={20} color={colors.muted} />
      </Pressable>
      {expanded && Platform.OS === 'ios' ? (
        <View style={styles.picker}>
          <DateTimePicker
            mode="time"
            display="spinner"
            value={draft}
            locale="es-AR"
            is24Hour
            themeVariant="dark"
            timeZoneName={AGENDA_TIME_ZONE}
            minuteInterval={OPERATION_SCHEDULE_STEP_MINUTES}
            disabled={disabled}
            onValueChange={(_event, selected) => setDraft(selected)}
          />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => setExpanded(false)}
              style={styles.button}
            >
              <Text style={styles.label}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => {
                onChange(scheduleFields(draft.toISOString()).time);
                setExpanded(false);
              }}
              style={styles.button}
            >
              <Text style={styles.confirm}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.muted, lineHeight: 22 },
  trigger: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  time: {
    flex: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  disabled: { opacity: 0.5 },
  picker: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  button: { minHeight: 48, padding: 14, justifyContent: 'center' },
  confirm: { color: colors.accent, fontWeight: '800' },
  error: { color: '#ff8d87' },
});
