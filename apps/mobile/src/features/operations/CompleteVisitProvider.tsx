import { createContext, useContext, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCompleteTechOperation } from '@servicienta/query-hooks';
import type { ChatConversationOperation } from '@servicienta/types';
import { formatDateTime } from '@/lib/format';
import { AGENDA_TIME_ZONE } from '@/features/today/agenda';
import { colors } from '@/theme/colors';

type CompletionVisit = Pick<
  ChatConversationOperation,
  'id' | 'status' | 'scheduled_at'
> & { clientName?: string };
const CompleteVisitContext = createContext<
  ((visit: CompletionVisit) => void) | null
>(null);
export const COMPLETE_VISIT_DESCRIPTION =
  'Al completar la visita, el cliente podrá confirmar el trabajo y dejarte una reseña.';

export function useCompleteVisit() {
  const open = useContext(CompleteVisitContext);
  if (!open) throw new Error('Falta CompleteVisitProvider');
  return open;
}

export function CompleteVisitProvider({ children }: PropsWithChildren) {
  const [visit, setVisit] = useState<CompletionVisit | null>(null);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const complete = useCompleteTechOperation();

  function open(next: CompletionVisit) {
    if (busy.current || next.status !== 'scheduled') return;
    setError('');
    setVisit(next);
  }
  function close() {
    if (!busy.current) setVisit(null);
  }
  async function confirm() {
    if (!visit || busy.current) return;
    busy.current = true;
    setError('');
    try {
      await complete.mutateAsync(visit.id);
      setVisit(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo completar la visita. Reintentá.',
      );
    } finally {
      busy.current = false;
    }
  }

  return (
    <CompleteVisitContext.Provider value={open}>
      {children}
      <Modal
        visible={visit !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.popup}>
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>
                  Completar visita
                </Text>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={40}
                  color={colors.accent}
                  accessible={false}
                />
              </View>
              {visit?.clientName ? (
                <Text style={styles.name}>{visit.clientName}</Text>
              ) : null}
              {visit?.scheduled_at ? (
                <Text style={styles.copy}>
                  {formatDateTime(visit.scheduled_at, AGENDA_TIME_ZONE)}
                </Text>
              ) : null}
              <Text style={styles.copy}>{COMPLETE_VISIT_DESCRIPTION}</Text>
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: complete.isPending,
                  busy: complete.isPending,
                }}
                disabled={complete.isPending}
                onPress={() => void confirm()}
                style={[styles.primary, complete.isPending && styles.disabled]}
              >
                {complete.isPending ? (
                  <ActivityIndicator color={colors.text} />
                ) : null}
                <Text style={styles.buttonText}>
                  {complete.isPending
                    ? 'Completando…'
                    : 'Confirmar y completar visita'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: complete.isPending }}
                disabled={complete.isPending}
                onPress={close}
                style={[
                  styles.secondary,
                  complete.isPending && styles.disabled,
                ]}
              >
                <Text style={styles.buttonText}>Atrás</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </CompleteVisitContext.Provider>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  popup: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { padding: 22, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { flex: 1, fontSize: 24, fontWeight: '900', color: colors.text },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  primary: {
    minHeight: 52,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  secondary: {
    minHeight: 52,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1,
  },
  error: { color: '#ff8d87', lineHeight: 22 },
  disabled: { opacity: 0.5 },
});
