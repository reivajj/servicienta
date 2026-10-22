import {
  ListFilters,
  ListPagination,
  useListFilters,
} from '@/features/filters/ListFilters';
import { CardSchedule } from '@/components/CardSchedule';
import { Ionicons } from '@expo/vector-icons';
import { AddressLink } from '@/components/AddressLink';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentOrders, useCurrentUser } from '@servicienta/query-hooks';
import type { Order, OrderStatus } from '@servicienta/types';
import { StatusChip } from '@/components/StatusChip';
import { formatOrderStatus, formatPersonName, formatSlug } from '@/lib/format';
import { colors } from '@/theme/colors';

const filterStatuses: { value: OrderStatus; label: string }[] = [
  'pending',
  'accepted',
  'in_progress',
  'completed_tech',
  'completion_rejected',
  'completed',
  'cancelled',
].map((value) => ({
  value: value as OrderStatus,
  label: formatOrderStatus(value as OrderStatus),
}));

export function OrdersScreen() {
  const { data: currentUser } = useCurrentUser();
  const { filters, change, page, setPage } = useListFilters<OrderStatus>();
  const isTechnician = currentUser?.role === 'technician';
  const router = useRouter();
  const { data, error, isLoading, isRefetching, refetch } = useCurrentOrders({
    page,
    pageSize: 25,
    ...(isTechnician ? filters : {}),
  });

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        data={data?.items ?? []}
        keyExtractor={(order) => order.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Solicitudes</Text>
            <Text style={styles.title}>Pedidos</Text>
            {data ? (
              <Text style={styles.copy}>
                {data?.summary.totalOrders ?? 0} pedidos ·{' '}
                {data?.summary.pendingOrders ?? 0} pendientes
              </Text>
            ) : null}
            {isTechnician ? (
              <ListFilters
                value={filters}
                onChange={change}
                statuses={filterStatuses}
                dateLabel="Fecha de creación"
                searchHint="Buscá por nota, nombre del cliente, zona o artefacto."
              />
            ) : null}
            {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
            {error ? (
              <Text style={styles.error}>{getErrorMessage(error)}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <EmptyState message="No hay pedidos que coincidan con los filtros." />
          ) : null
        }
        ListFooterComponent={
          data ? (
            <ListPagination
              page={page}
              totalPages={data.pagination.totalPages}
              onChange={setPage}
              disabled={isLoading || isRefetching}
            />
          ) : null
        }
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() =>
              router.push({
                pathname: '/orders/[orderId]',
                params: { orderId: item.id },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const { data: user } = useCurrentUser();
  const name =
    user?.role === 'client'
      ? formatPersonName(order.technician_name, order.technician_surname)
      : formatPersonName(order.client_name, order.client_surname);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver pedido de ${name}`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.cardTitle}>{name}</Text>
        </View>
        <View>
          <StatusChip>{formatOrderStatus(order.status)}</StatusChip>
        </View>
      </View>

      <CardSchedule value={order.created_at} label="Creado" />
      <View style={styles.infoRow}>
        <Ionicons
          name="build-outline"
          size={19}
          color={colors.muted}
          accessible={false}
        />
        <Text style={[styles.secondaryText, styles.infoCopy]}>
          {formatSlug(order.appliance_type_slug)}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons
          name="location-outline"
          size={19}
          color={colors.accent}
          accessible={false}
        />
        <AddressLink
          address={order.service_address_text}
          zone={order.zone_slug}
          style={[styles.primaryText, styles.infoCopy]}
        >
          {order.service_address_text} · {formatSlug(order.zone_slug)}
        </AddressLink>
      </View>
      <View style={styles.divider} />
      <Text numberOfLines={2} ellipsizeMode="tail" style={styles.description}>
        {order.description}
      </Text>
    </Pressable>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Todo al día</Text>
      <Text style={styles.copy}>{message}</Text>
    </View>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No se pudieron cargar los pedidos.';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: 14,
    padding: 20,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.background,
  },
  header: {
    gap: 8,
    marginBottom: 10,
    paddingTop: 18,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '900',
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#ff8d87',
    lineHeight: 20,
  },
  card: {
    gap: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoCopy: { flex: 1 },
  primaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryText: {
    color: colors.muted,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  description: {
    color: colors.text,
    lineHeight: 21,
  },
  empty: {
    gap: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
});
