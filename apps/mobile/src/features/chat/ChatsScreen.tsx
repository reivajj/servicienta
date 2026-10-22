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
import {
  useCurrentChatConversations,
  useCurrentUser,
} from '@servicienta/query-hooks';
import type { ChatConversation } from '@servicienta/types';
import { StatusChip } from '@/components/StatusChip';
import {
  formatDateTime,
  formatOrderStatus,
  formatPersonName,
} from '@/lib/format';
import { colors } from '@/theme/colors';

export function ChatsScreen() {
  const router = useRouter();
  const { data, error, isLoading, isRefetching, refetch } =
    useCurrentChatConversations({ page: 1, pageSize: 100 });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.copy}>Cargando conversaciones…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={data?.items ?? []}
        keyExtractor={(conversation) => conversation.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Coordinación</Text>
            <Text style={styles.title}>Chats</Text>
            <Text style={styles.copy}>
              {data?.pagination.total ?? 0} conversaciones
            </Text>
            {error ? (
              <Text style={styles.error}>
                {error instanceof Error
                  ? error.message
                  : 'No se pudieron cargar las conversaciones.'}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Todavía no tenés chats</Text>
            <Text style={styles.copy}>
              Las conversaciones aparecerán cuando exista un chat asociado a un
              pedido.
            </Text>
          </View>
        }
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            onPress={() => {
              if (!item.order_id) return;
              router.push({
                pathname: '/chats/[orderId]',
                params: { orderId: item.order_id },
              });
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

function ConversationCard({
  conversation,
  onPress,
}: {
  conversation: ChatConversation;
  onPress: () => void;
}) {
  const { data: user } = useCurrentUser();
  const order = conversation.order;
  const clientName = order
    ? user?.role === 'client'
      ? formatPersonName(order.technician_name, order.technician_surname)
      : formatPersonName(order.client_name, order.client_surname)
    : 'Conversación';

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.cardTitle}>{clientName}</Text>
          <Text style={styles.cardDate}>
            {formatDateTime(conversation.last_message_at)}
          </Text>
        </View>
        {conversation.unread_count > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {conversation.unread_count > 99
                ? '99+'
                : conversation.unread_count}
            </Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={2} style={styles.preview}>
        {conversation.last_message?.body ??
          'Abrí el chat para iniciar la conversación.'}
      </Text>

      {order ? (
        <StatusChip>{formatOrderStatus(order.status)}</StatusChip>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: 14, padding: 20, paddingBottom: 32 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.background,
  },
  header: { gap: 8, marginBottom: 10, paddingTop: 18 },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 36, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  error: { color: '#ff8d87', lineHeight: 20 },
  card: {
    gap: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderCopy: { flex: 1, gap: 3 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  cardDate: { color: colors.muted, fontSize: 12 },
  preview: { color: colors.text, lineHeight: 21 },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  unreadText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  empty: {
    gap: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
});
