import { useCompleteVisit } from './CompleteVisitProvider';
import { AddressLink } from '@/components/AddressLink';
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentOperation, useCurrentUser } from '@servicienta/query-hooks';
import { StatusChip } from '@/components/StatusChip';
import {
  formatDateTime,
  formatOperationStatus,
  formatOrderStatus,
  formatPersonName,
  formatSlug,
} from '@/lib/format';
import { AGENDA_TIME_ZONE } from '@/features/today/agenda';
import { colors } from '@/theme/colors';
import { VisitCompletion } from './VisitCompletion';

export function OperationDetailScreen({
  operationId,
}: {
  operationId: string;
}) {
  const router = useRouter();
  const openCompleteVisit = useCompleteVisit();
  const { data: user } = useCurrentUser();
  const {
    data: operation,
    error,
    isLoading,
    refetch,
  } = useCurrentOperation(operationId);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.muted}>Cargando visita…</Text>
      </View>
    );
  }

  if (error || !operation) {
    return (
      <View style={styles.centered}>
        <Text accessibilityRole="alert" style={styles.error}>
          {error instanceof Error
            ? error.message
            : 'No se pudo cargar la visita.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={() => void refetch()}
        >
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <StatusChip>{formatOperationStatus(operation.status)}</StatusChip>
        <Text style={styles.title}>
          {user?.role === 'client'
            ? formatPersonName(
                operation.technician_name,
                operation.technician_surname,
              )
            : formatPersonName(operation.client_name, operation.client_surname)}
        </Text>
        <Text selectable style={styles.muted}>
          Visita {operation.id}
        </Text>
        <View style={styles.card}>
          <Field
            label="Fecha y hora · Argentina"
            value={formatDateTime(operation.scheduled_at, AGENDA_TIME_ZONE)}
          />
          <Field
            label="Equipo"
            value={formatSlug(operation.appliance_type_slug)}
          />
          <Field
            label="Descripción de la visita"
            value={operation.description ?? 'Sin descripción'}
          />
        </View>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.muted}>Dirección</Text>
            <AddressLink
              address={operation.service_address_text}
              zone={operation.zone_slug}
            />
          </View>
          <Field label="Zona" value={formatSlug(operation.zone_slug)} />
          {operation.address_notes ? (
            <Field label="Indicaciones" value={operation.address_notes} />
          ) : null}
          <Field
            label={
              user?.role === 'client'
                ? 'Teléfono del técnico'
                : 'Teléfono del cliente'
            }
            value={
              (user?.role === 'client'
                ? operation.technician_phone
                : operation.client_phone) ?? 'Sin definir'
            }
          />
        </View>
        {user ? (
          <VisitCompletion
            key={operation.id}
            operation={operation}
            user={user}
          />
        ) : null}
        <View style={styles.card}>
          <Field label="Pedido asociado" value={operation.order_id} />
          {operation.order_status ? (
            <Field
              label="Estado del pedido"
              value={formatOrderStatus(operation.order_status)}
            />
          ) : null}
          {operation.technician_completed_at ? (
            <Field
              label="Trabajo terminado"
              value={formatDateTime(
                operation.technician_completed_at,
                AGENDA_TIME_ZONE,
              )}
            />
          ) : null}
          {operation.completed_at ? (
            <Field
              label="Finalización confirmada"
              value={formatDateTime(operation.completed_at, AGENDA_TIME_ZONE)}
            />
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <View style={styles.navigationActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/chats/[orderId]',
                params: {
                  orderId: operation.order_id,
                  operationId: operation.id,
                },
              })
            }
            style={[styles.secondaryButton, styles.navigationButton]}
          >
            <Text style={styles.buttonText}>Chat</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/orders/[orderId]',
                params: { orderId: operation.order_id },
              })
            }
            style={[styles.secondaryButton, styles.navigationButton]}
          >
            <Text style={styles.buttonText}>Pedido</Text>
          </Pressable>
        </View>
        {user?.role === 'technician' &&
        user.id === operation.technician_id &&
        operation.status === 'scheduled' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => openCompleteVisit(operation)}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>Completar visita</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.muted}>{label}</Text>
      <Text selectable style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: colors.background,
  },
  content: { padding: 20, gap: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: {
    padding: 18,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  field: { gap: 4 },
  value: { color: colors.text, fontSize: 16, lineHeight: 24 },
  actions: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  navigationActions: { flexDirection: 'row', gap: 12 },
  navigationButton: { flex: 1 },
  primaryButton: {
    minHeight: 52,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    minHeight: 52,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  error: { color: '#ff8d87', lineHeight: 22 },
});
