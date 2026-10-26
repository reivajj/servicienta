import type { ScrollViewInstance } from 'react-native';
import { CardSchedule } from '@/components/CardSchedule';
import type { ComponentProps } from 'react';
import { ActionLabel } from '@/components/ActionLabel';
import { Ionicons } from '@expo/vector-icons';
import { AddressLink } from '@/components/AddressLink';
import { useCallback, useRef } from 'react';
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
  focusCompletion = false,
}: {
  operationId: string;
  focusCompletion?: boolean;
}) {
  const router = useRouter();
  const scrollRef = useRef<ScrollViewInstance>(null);
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
          <ActionLabel icon="refresh-outline" textStyle={styles.buttonText}>
            Reintentar
          </ActionLabel>
        </Pressable>
      </View>
    );
  }

  const isTechnician = user?.role === 'technician';
  const canOpenProfile =
    isTechnician || Boolean(operation.technician_public_slug);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {user ? (
          <View
            onLayout={(event) => {
              if (!focusCompletion || user.role !== 'client') return;
              const y = event.nativeEvent.layout.y;
              requestAnimationFrame(() =>
                scrollRef.current?.scrollTo({
                  y: Math.max(0, y - 16),
                  animated: true,
                }),
              );
            }}
          >
            <VisitCompletion
              key={operation.id}
              operation={operation}
              user={user}
            />
          </View>
        ) : null}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {user?.role === 'client'
                ? formatPersonName(
                    operation.technician_name,
                    operation.technician_surname,
                  )
                : formatPersonName(
                    operation.client_name,
                    operation.client_surname,
                  )}
            </Text>
            <View>
              <StatusChip>{formatOperationStatus(operation.status)}</StatusChip>
            </View>
          </View>
          <CardSchedule
            value={operation.scheduled_at}
            timeZone={AGENDA_TIME_ZONE}
          />
          <View style={styles.infoRow}>
            <Ionicons
              name="build-outline"
              size={20}
              color={colors.muted}
              accessible={false}
            />
            <Text style={styles.equipment}>
              {formatSlug(operation.appliance_type_slug)}
            </Text>
          </View>
          <View style={styles.divider} />
          <Field
            icon="document-text-outline"
            label="Descripción de la visita"
            value={operation.description ?? 'Sin descripción'}
          />
        </View>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={colors.accent}
              accessible={false}
            />
            <View style={styles.field}>
              <Text style={styles.muted}>Dirección</Text>
              <AddressLink
                address={operation.service_address_text}
                zone={operation.zone_slug}
              />
            </View>
          </View>
          <Field
            icon="map-outline"
            label="Zona"
            value={formatSlug(operation.zone_slug)}
          />
          {operation.address_notes ? (
            <Field
              icon="information-circle-outline"
              label="Indicaciones"
              value={operation.address_notes}
            />
          ) : null}
          <Field
            icon="call-outline"
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

        <View style={styles.card}>
          <Field label="Identificador de visita" value={operation.id} />
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
                pathname: '/orders/[orderId]',
                params: { orderId: operation.order_id },
              })
            }
            style={[styles.navigationButton, styles.orderButton]}
          >
            <Text style={[styles.buttonText, styles.orderText]}>Pedido</Text>
            <Ionicons
              name="clipboard-outline"
              size={22}
              color="#dfbc75"
              accessible={false}
            />
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={
              isTechnician
                ? 'Ver información del cliente'
                : 'Ver perfil público del técnico'
            }
            accessibilityState={{ disabled: !canOpenProfile }}
            disabled={!canOpenProfile}
            onPress={() => {
              if (isTechnician)
                router.push({
                  pathname: '/orders/[orderId]/client',
                  params: { orderId: operation.order_id },
                });
              else if (operation.technician_public_slug)
                router.push({
                  pathname: '/technicians/[publicSlug]',
                  params: { publicSlug: operation.technician_public_slug },
                });
            }}
            style={[
              styles.navigationButton,
              styles.technicianButton,
              !canOpenProfile && styles.disabled,
            ]}
          >
            <Text style={[styles.buttonText, styles.technicianText]}>
              {isTechnician ? 'Cliente' : 'Técnico'}
            </Text>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color="#91bfff"
              accessible={false}
            />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir chat del pedido"
          onPress={() =>
            router.push({
              pathname: '/chats/[orderId]',
              params: {
                orderId: operation.order_id,
                operationId: operation.id,
              },
            })
          }
          style={styles.chatButton}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={26}
            color={colors.text}
            accessible={false}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={styles.infoRow}>
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={colors.muted}
          accessible={false}
        />
      ) : null}
      <View style={styles.field}>
        <Text style={styles.muted}>{label}</Text>
        <Text selectable style={styles.value}>
          {value}
        </Text>
      </View>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardTitle: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '900' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  equipment: { flex: 1, color: colors.muted, fontSize: 15, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: {
    padding: 18,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  field: { flex: 1, gap: 4 },
  value: { color: colors.text, fontSize: 16, lineHeight: 24 },
  actions: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  navigationActions: { flexDirection: 'row', gap: 12 },
  navigationButton: {
    flex: 1,
    minHeight: 52,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
  },
  orderButton: {
    backgroundColor: 'rgba(223,188,117,0.12)',
    borderColor: 'rgba(223,188,117,0.45)',
  },
  orderText: { color: '#dfbc75' },
  technicianButton: {
    backgroundColor: 'rgba(100,158,235,0.14)',
    borderColor: 'rgba(145,191,255,0.45)',
  },
  technicianText: { color: '#91bfff' },
  chatButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  disabled: { opacity: 0.45 },
  primaryButton: {
    minHeight: 52,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },

  buttonText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  error: { color: '#ff8d87', lineHeight: 22 },
});
