import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { CardSchedule } from '@/components/CardSchedule';
import { ActionLabel } from '@/components/ActionLabel';
import { AddressLink } from '@/components/AddressLink';
import { useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAcceptOrder,
  useCurrentOrder,
  useCurrentUser,
} from '@servicienta/query-hooks';
import { StatusChip } from '@/components/StatusChip';
import {
  formatDateTime,
  formatOrderStatus,
  formatPersonName,
  formatSlug,
} from '@/lib/format';
import { colors } from '@/theme/colors';

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data: order, error, isLoading, refetch } = useCurrentOrder(orderId);
  const { data: currentUser } = useCurrentUser();
  const acceptOrder = useAcceptOrder();
  const accepting = useRef(false);

  function openChat() {
    router.push({ pathname: '/chats/[orderId]', params: { orderId } });
  }

  function handleAccept() {
    if (!order || order.status !== 'pending' || accepting.current) return;
    accepting.current = true;
    acceptOrder.mutate(order.id, {
      onSuccess: () => openChat(),
      onError: () => {
        void refetch();
      },
      onSettled: () => {
        accepting.current = false;
      },
    });
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.muted}>Cargando pedido…</Text>
      </View>
    );
  }

  if (!order || error) {
    return (
      <View style={styles.centered}>
        <Text accessibilityRole="alert" style={styles.error}>
          {error instanceof Error
            ? error.message
            : 'No se pudo cargar el pedido.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refetch()}
          style={styles.button}
        >
          <ActionLabel icon="refresh-outline" textStyle={styles.buttonText}>
            Reintentar
          </ActionLabel>
        </Pressable>
      </View>
    );
  }

  const isAssigned = order.technician_id === currentUser?.id;
  const canAccept =
    currentUser?.role === 'technician' &&
    isAssigned &&
    order.status === 'pending';
  const canOpenChat =
    (isAssigned ||
      (currentUser?.role === 'client' && order.client_id === currentUser.id)) &&
    Boolean(order.technician_id) &&
    (currentUser?.role === 'client' || order.status !== 'pending') &&
    order.status !== 'cancelled';

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {currentUser?.role === 'client'
                ? formatPersonName(
                    order.technician_name,
                    order.technician_surname,
                  )
                : formatPersonName(order.client_name, order.client_surname)}
            </Text>
            <View>
              <StatusChip>{formatOrderStatus(order.status)}</StatusChip>
            </View>
          </View>
          <Text style={styles.muted}>
            {order.next_visit_at ? 'Visita agendada' : 'Fecha de creación'}
          </Text>
          <CardSchedule value={order.next_visit_at ?? order.created_at} />
          <View style={styles.infoRow}>
            <Ionicons
              name="build-outline"
              size={20}
              color={colors.muted}
              accessible={false}
            />
            <Text style={styles.equipment}>
              {formatSlug(order.appliance_type_slug)}
            </Text>
          </View>
          <View style={styles.divider} />
          <Field
            icon="document-text-outline"
            label="Problema informado"
            value={order.description}
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
                address={order.service_address_text}
                zone={order.zone_slug}
              />
            </View>
          </View>
          <Field
            icon="map-outline"
            label="Zona"
            value={formatSlug(order.zone_slug)}
          />
          {order.address_notes ? (
            <Field
              icon="information-circle-outline"
              label="Indicaciones"
              value={order.address_notes}
            />
          ) : null}
        </View>
        <View style={styles.card}>
          <Field
            icon="call-outline"
            label="Teléfono"
            value={
              (currentUser?.role === 'client'
                ? order.technician_phone
                : order.client_phone) ?? 'Sin definir'
            }
          />
          <Field label="Identificador del pedido" value={order.id} />
          {order.next_visit_at ? (
            <Field
              icon="calendar-outline"
              label="Creado"
              value={formatDateTime(order.created_at)}
            />
          ) : null}
          <Field
            icon="refresh-outline"
            label="Última actualización"
            value={formatDateTime(order.updated_at)}
          />
        </View>
      </ScrollView>
      {canAccept || canOpenChat || acceptOrder.error ? (
        <View style={styles.actions}>
          {acceptOrder.error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {acceptOrder.error instanceof Error
                ? acceptOrder.error.message
                : 'No se pudo aceptar el pedido. Reintentá.'}
            </Text>
          ) : null}
          {canAccept ? (
            <Text style={styles.muted}>
              Al aceptar, se abrirá el chat para coordinar la visita.
            </Text>
          ) : null}
          {canAccept || canOpenChat ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: acceptOrder.isPending,
                busy: acceptOrder.isPending,
              }}
              disabled={acceptOrder.isPending}
              onPress={canAccept ? handleAccept : openChat}
              style={[styles.button, acceptOrder.isPending && styles.disabled]}
            >
              {acceptOrder.isPending ? (
                <ActivityIndicator color={colors.text} />
              ) : null}
              <ActionLabel
                icon={
                  canAccept
                    ? 'checkmark-outline'
                    : 'chatbubble-ellipses-outline'
                }
                textStyle={styles.buttonText}
              >
                {acceptOrder.isPending
                  ? 'Aceptando pedido…'
                  : canAccept
                    ? 'Aceptar y abrir chat'
                    : 'Abrir chat'}
              </ActionLabel>
            </Pressable>
          ) : null}
        </View>
      ) : null}
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
    gap: 16,
    padding: 24,
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
  error: { color: '#ff8d87', lineHeight: 22 },
  button: {
    minHeight: 52,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  buttonText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
