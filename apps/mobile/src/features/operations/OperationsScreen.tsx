import { useCompleteVisit } from './CompleteVisitProvider';
import {
  ListFilters,
  ListPagination,
  useListFilters,
} from '@/features/filters/ListFilters';
import { CardSchedule } from '@/components/CardSchedule';
import { AddressLink } from '@/components/AddressLink';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentOperations, useCurrentUser } from '@servicienta/query-hooks';
import type { Operation, OperationStatus } from '@servicienta/types';
import { StatusChip } from '@/components/StatusChip';
import {
  formatTime,
  formatOperationStatus,
  formatPersonName,
  formatSlug,
} from '@/lib/format';
import { colors } from '@/theme/colors';

const filterStatuses: { value: OperationStatus; label: string }[] = [
  'pending',
  'scheduled',
  'completed_tech',
  'completion_rejected',
  'completed',
  'cancelled',
].map((value) => ({
  value: value as OperationStatus,
  label: formatOperationStatus(value as OperationStatus),
}));

export function OperationsScreen() {
  const { data: currentUser } = useCurrentUser();
  const { filters, change, page, setPage } = useListFilters<OperationStatus>();
  const isTechnician = currentUser?.role === 'technician';
  const { data, error, isLoading, isRefetching, refetch } =
    useCurrentOperations({
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
        keyExtractor={(operation) => operation.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Trabajo operativo</Text>
            <Text style={styles.title}>Visitas</Text>
            {data ? (
              <Text style={styles.copy}>
                {data?.summary.totalOperations ?? 0} visitas ·{' '}
                {data?.summary.scheduledOperations ?? 0} agendadas
              </Text>
            ) : null}
            {isTechnician ? (
              <ListFilters
                value={filters}
                onChange={change}
                statuses={filterStatuses}
                dateLabel="Fecha de la visita"
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
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin visitas</Text>
              <Text style={styles.copy}>
                No hay visitas que coincidan con los filtros.
              </Text>
            </View>
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
        renderItem={({ item }) => <OperationCard operation={item} />}
      />
    </SafeAreaView>
  );
}

export function OperationCard({
  operation,
  timeZone,
  today = false,
}: {
  operation: Operation;
  timeZone?: string;
  today?: boolean;
}) {
  const router = useRouter();
  const openCompleteVisit = useCompleteVisit();
  const { width } = useWindowDimensions();
  const { data: user } = useCurrentUser();
  const name =
    user?.role === 'client'
      ? formatPersonName(
          operation.technician_name,
          operation.technician_surname,
        )
      : formatPersonName(operation.client_name, operation.client_surname);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver visita de ${name}`}
      onPress={() =>
        router.push({
          pathname: '/operations/[operationId]',
          params: { operationId: operation.id },
        })
      }
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
    >
      {today ? (
        <View style={styles.todayHeader}>
          <View style={styles.timeRow}>
            <Ionicons
              name="alarm-outline"
              size={31.2}
              style={styles.timeIcon}
              color={colors.accent}
              accessible={false}
            />
            <Text style={[styles.todayTime, width < 380 && styles.compactTime]}>
              {formatTime(operation.scheduled_at, timeZone).replace(/hs$/, '')}
              {operation.scheduled_at ? (
                <Text style={styles.timeUnit}>hs</Text>
              ) : null}
            </Text>
          </View>
          <View style={styles.todayStatus}>
            <View>
              <StatusChip>{formatOperationStatus(operation.status)}</StatusChip>
            </View>
            {user?.role === 'technician' &&
            user.id === operation.technician_id &&
            operation.status === 'scheduled' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Completar visita de ${name}`}
                onPress={(event) => {
                  event.stopPropagation();
                  openCompleteVisit({ ...operation, clientName: name });
                }}
                hitSlop={8}
                style={styles.completeIcon}
              >
                <Ionicons
                  name="checkmark-outline"
                  size={20}
                  color={colors.accent}
                  accessible={false}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.cardTitle}>{name}</Text>
        </View>
        {!today ? (
          <View>
            <StatusChip>{formatOperationStatus(operation.status)}</StatusChip>
          </View>
        ) : null}
      </View>

      {!today ? (
        <CardSchedule value={operation.scheduled_at} timeZone={timeZone} />
      ) : null}
      <>
        <View style={styles.infoRow}>
          <Ionicons
            name="build-outline"
            size={19}
            color={colors.muted}
            accessible={false}
          />
          <Text style={[styles.secondaryText, styles.infoCopy]}>
            {formatSlug(operation.appliance_type_slug)}
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
            address={operation.service_address_text}
            zone={operation.zone_slug}
            style={[styles.primaryText, styles.infoCopy]}
          >
            {operation.service_address_text ?? 'Dirección sin definir'} ·{' '}
            {formatSlug(operation.zone_slug)}
          </AddressLink>
        </View>
      </>
      {!today && operation.description ? (
        <>
          <View style={styles.divider} />
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={styles.description}
          >
            {operation.description}
          </Text>
        </>
      ) : null}
    </Pressable>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No se pudieron cargar las visitas.';
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
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  todayStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    transform: [{ translateY: -3 }],
  },
  completeIcon: {
    width: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  timeIcon: {
    // Align the visible alarm glyph with the numerals, accounting for font metrics.
    transform: [{ translateY: -4 }],
    width: 32,
    height: 40,
    lineHeight: 40,
    textAlign: 'center',
    includeFontPadding: false,
  },
  todayTime: {
    color: colors.accent,
    fontSize: 34,
    lineHeight: 40,
    includeFontPadding: false,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  compactTime: { fontSize: 28 },
  timeUnit: { fontSize: 16, color: colors.muted, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoCopy: { flex: 1 },
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
