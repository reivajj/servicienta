import { useRouter } from 'expo-router';
import { StatusChip } from '@/components/StatusChip';
import { useCompleteVisit } from '@/features/operations/CompleteVisitProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useCancelOperationFromChat,
  useScheduleOperationFromChat,
} from '@servicienta/query-hooks';
import type { ChatConversationOperation } from '@servicienta/types';
import { formatDateTime, formatOperationStatus } from '@/lib/format';
import { colors } from '@/theme/colors';
import { AGENDA_TIME_ZONE } from '@/features/today/agenda';
import { parseArgentinaSchedule, scheduleFields } from './schedule';
import { VisitCalendar } from './VisitCalendar';
import { TimePickerField } from './TimePickerField';

export function ChatQuickActions({
  conversationId,
  operation,
  canManage,
}: {
  conversationId: string;
  operation: ChatConversationOperation;
  canManage: boolean;
}) {
  const router = useRouter();
  const openCompleteVisit = useCompleteVisit();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'schedule' | 'cancel'>('schedule');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const busy = useRef(false);
  const schedule = useScheduleOperationFromChat();
  const cancel = useCancelOperationFromChat();
  const pending = schedule.isPending || cancel.isPending;
  const canAct =
    operation.status === 'pending' || operation.status === 'scheduled';

  function close() {
    if (!busy.current) setVisible(false);
  }
  function startSchedule() {
    const fields = scheduleFields(operation?.scheduled_at);
    setDay(fields.day);
    setTime(fields.time);
    setDescription(operation?.description ?? '');
    setError('');
    setMode('schedule');
    setVisible(true);
  }
  function submit() {
    if (!operation || !canAct || busy.current) return;
    setError('');
    let scheduledAt: string;
    try {
      scheduledAt = parseArgentinaSchedule(day.trim(), time.trim());
      if (!description.trim())
        throw new Error('La descripción técnica es obligatoria.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Revisá los datos.');
      return;
    }
    busy.current = true;
    schedule.mutate(
      {
        conversationId,
        input: {
          operation_id: operation.id,
          scheduled_at: scheduledAt,
          description: description.trim(),
        },
      },
      {
        onSuccess: () => setVisible(false),
        onError: (error) =>
          setError(
            error instanceof Error
              ? error.message
              : 'No se pudo agendar la visita.',
          ),
        onSettled: () => {
          busy.current = false;
        },
      },
    );
  }
  function confirmCancel() {
    if (!operation || !canAct || busy.current) return;
    busy.current = true;
    setError('');
    cancel.mutate(
      { conversationId, input: { operation_id: operation.id } },
      {
        onSuccess: () => setVisible(false),
        onError: (error) =>
          setError(
            error instanceof Error
              ? error.message
              : 'No se pudo cancelar la visita.',
          ),
        onSettled: () => {
          busy.current = false;
        },
      },
    );
  }

  return (
    <>
      <View style={styles.toolbar}>
        {operation ? (
          <View style={styles.status}>
            <StatusChip>{formatOperationStatus(operation.status)}</StatusChip>
          </View>
        ) : null}
        {canManage && canAct ? (
          <View style={styles.actionIcons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                operation?.status === 'scheduled'
                  ? 'Cambiar fecha y horario'
                  : 'Agendar visita'
              }
              onPress={startSchedule}
              style={styles.trigger}
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color={colors.accent}
                accessible={false}
              />
            </Pressable>
            {operation?.status === 'scheduled' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Completar visita"
                onPress={() => openCompleteVisit(operation)}
                style={styles.trigger}
              >
                <Ionicons
                  name="checkmark-outline"
                  size={24}
                  color={colors.accent}
                  accessible={false}
                />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar visita"
              onPress={() => {
                setMode('cancel');
                setError('');
                setVisible(true);
              }}
              style={[styles.trigger, styles.cancelTrigger]}
            >
              <Ionicons
                name="close-outline"
                size={24}
                color="#d47773"
                accessible={false}
              />
            </Pressable>
          </View>
        ) : null}
        {!canManage && operation ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/operations/[operationId]',
                params: { operationId: operation.id },
              })
            }
            style={styles.detailButton}
          >
            <Text style={styles.copy}>
              {operation.status === 'completed_tech'
                ? 'Confirmar visita'
                : operation.status === 'completed'
                  ? 'Ver visita y reseña'
                  : 'Ver visita'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Modal
        visible={visible}
        transparent={mode === 'cancel'}
        animationType={mode === 'cancel' ? 'fade' : 'slide'}
        onRequestClose={close}
      >
        <View style={mode === 'cancel' ? styles.backdrop : styles.screen}>
          <SafeAreaView
            style={mode === 'cancel' ? styles.popup : styles.screen}
          >
            <KeyboardAvoidingView
              style={mode === 'cancel' ? undefined : styles.screen}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.title}>
                  {mode === 'cancel'
                    ? '¿Cancelar visita?'
                    : operation?.status === 'scheduled'
                      ? 'Cambiar fecha y horario'
                      : 'Agendar visita'}
                </Text>
                {operation ? (
                  <Text style={styles.copy}>
                    {formatOperationStatus(operation.status)} ·{' '}
                    {formatDateTime(operation.scheduled_at, AGENDA_TIME_ZONE)}
                  </Text>
                ) : null}
                {mode === 'schedule' ? (
                  <>
                    <VisitCalendar
                      key={operation.id}
                      value={day}
                      onChange={setDay}
                      disabled={pending}
                    />
                    <Text style={styles.copy}>
                      Fecha elegida: {day} · Hora de Argentina
                    </Text>
                    <TimePickerField
                      day={day}
                      value={time}
                      onChange={setTime}
                      disabled={pending}
                    />
                    <Text style={styles.copy}>Descripción técnica</Text>
                    <TextInput
                      accessibilityLabel="Descripción técnica"
                      value={description}
                      onChangeText={setDescription}
                      editable={!pending}
                      multiline
                      style={[styles.input, styles.description]}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={pending || !canAct}
                      style={[
                        styles.primary,
                        (pending || !canAct) && styles.disabled,
                      ]}
                      accessibilityState={{
                        disabled: pending || !canAct,
                        busy: schedule.isPending,
                      }}
                      onPress={submit}
                    >
                      {schedule.isPending ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : null}
                      <Text style={styles.text}>
                        {pending
                          ? 'Guardando…'
                          : operation?.status === 'scheduled'
                            ? 'Guardar nuevo horario'
                            : 'Agendar visita'}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.copy}>
                      Esta acción es irrevocable. Para cambiar la fecha o el
                      horario, usá el calendario.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={pending || !canAct}
                      style={[
                        styles.button,
                        (pending || !canAct) && styles.disabled,
                      ]}
                      accessibilityState={{
                        disabled: pending || !canAct,
                        busy: cancel.isPending,
                      }}
                      onPress={confirmCancel}
                    >
                      {cancel.isPending ? (
                        <ActivityIndicator size="small" color="#ff8d87" />
                      ) : null}
                      <Text style={styles.error}>
                        {pending ? 'Cancelando…' : 'Sí, cancelar visita'}
                      </Text>
                    </Pressable>
                  </>
                )}
                {error ? (
                  <Text accessibilityRole="alert" style={styles.error}>
                    {error}
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={pending}
                  style={styles.button}
                  onPress={close}
                >
                  <Text style={styles.text}>
                    {mode === 'cancel' ? 'Volver' : 'Cerrar'}
                  </Text>
                </Pressable>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  status: { marginRight: 'auto' },
  actionIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cancelTrigger: { borderColor: '#d47773' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popup: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { padding: 20, gap: 16 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900' },
  text: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700' },
  copy: { color: colors.muted, lineHeight: 22 },
  trigger: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  group: { gap: 12 },
  primary: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: { borderColor: colors.accent },
  input: {
    minHeight: 50,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  description: { minHeight: 96, textAlignVertical: 'top' },
  error: { color: '#ff8d87', lineHeight: 22 },
  disabled: { opacity: 0.5 },
});
