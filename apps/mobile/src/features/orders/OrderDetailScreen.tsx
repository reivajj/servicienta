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
          <Text style={styles.buttonText}>Reintentar</Text>
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
        <StatusChip>{formatOrderStatus(order.status)}</StatusChip>
        <Text style={styles.title}>
          {currentUser?.role === 'client'
            ? formatPersonName(order.technician_name, order.technician_surname)
            : formatPersonName(order.client_name, order.client_surname)}
        </Text>
        <Text selectable style={styles.muted}>
          Pedido {order.id}
        </Text>
        <View style={styles.card}>
          <Field label="Equipo" value={formatSlug(order.appliance_type_slug)} />
          <Field label="Problema informado" value={order.description} />
        </View>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.muted}>Dirección</Text>
            <AddressLink
              address={order.service_address_text}
              zone={order.zone_slug}
            />
          </View>
          <Field label="Zona" value={formatSlug(order.zone_slug)} />
          {order.address_notes ? (
            <Field label="Indicaciones" value={order.address_notes} />
          ) : null}
        </View>
        <View style={styles.card}>
          <Field
            label="Teléfono"
            value={
              (currentUser?.role === 'client'
                ? order.technician_phone
                : order.client_phone) ?? 'Sin definir'
            }
          />
          <Field label="Creado" value={formatDateTime(order.created_at)} />
          <Field
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
              <Text style={styles.buttonText}>
                {acceptOrder.isPending
                  ? 'Aceptando pedido…'
                  : canAccept
                    ? 'Aceptar y abrir chat'
                    : 'Abrir chat'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
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
    gap: 16,
    padding: 24,
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
