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
import { Ionicons } from '@expo/vector-icons';
import { useCurrentOrder, useCurrentUser } from '@servicienta/query-hooks';
import { AddressLink } from '@/components/AddressLink';
import { formatPersonName, formatSlug } from '@/lib/format';
import { colors } from '@/theme/colors';

export function ClientDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { data: order, error, isLoading, refetch } = useCurrentOrder(orderId);
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  if (isLoading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.muted}>Cargando cliente…</Text>
      </View>
    );
  if (error || !order)
    return (
      <View style={styles.centered}>
        <Text accessibilityRole="alert" style={styles.error}>
          {error instanceof Error
            ? error.message
            : 'No se pudo cargar el cliente.'}
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
  if (user?.role !== 'technician' || user.id !== order.technician_id)
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>
          Este detalle está disponible para el técnico del pedido.
        </Text>
      </View>
    );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {formatPersonName(order.client_name, order.client_surname)}
        </Text>
        <Text style={styles.muted}>Datos de contacto para este pedido</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="call-outline"
              size={22}
              color={colors.accent}
              accessible={false}
            />
            <View style={styles.field}>
              <Text style={styles.muted}>Teléfono</Text>
              <Text selectable style={styles.value}>
                {order.client_phone ?? 'Sin definir'}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <Ionicons
              name="logo-whatsapp"
              size={22}
              color={colors.accent}
              accessible={false}
            />
            <View style={styles.field}>
              <Text style={styles.muted}>WhatsApp</Text>
              <Text selectable style={styles.value}>
                {order.client_whatsapp_phone ?? 'Sin definir'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="location-outline"
              size={22}
              color={colors.accent}
              accessible={false}
            />
            <View style={styles.field}>
              <Text style={styles.muted}>Dirección del pedido</Text>
              <AddressLink
                address={order.service_address_text}
                zone={order.zone_slug}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.muted}>Zona</Text>
            <Text style={styles.value}>{formatSlug(order.zone_slug)}</Text>
          </View>
          {order.address_notes ? (
            <View style={styles.field}>
              <Text style={styles.muted}>Indicaciones</Text>
              <Text selectable style={styles.value}>
                {order.address_notes}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/orders/[orderId]', params: { orderId } })
          }
          style={styles.button}
        >
          <Text style={styles.buttonText}>Ver pedido</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  content: { padding: 20, gap: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  muted: { color: colors.muted, lineHeight: 22 },
  value: { color: colors.text, fontSize: 16, lineHeight: 24 },
  card: {
    padding: 18,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  field: { flex: 1, gap: 4 },
  button: {
    minHeight: 52,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  error: { color: '#ff8d87', lineHeight: 22 },
});
