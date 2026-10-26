import { ActionLabel } from '@/components/ActionLabel';
import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentClientOrders } from '@servicienta/query-hooks';
import type { Order } from '@servicienta/types';
import { colors } from '@/theme/colors';
import { organizeClientOrders } from './client-orders';

export function ClientOrdersScreen({
  renderOrder,
}: {
  renderOrder: (order: Order) => ReactElement;
}) {
  const [now, setNow] = useState(() => new Date());
  const [showHistory, setShowHistory] = useState(false);
  const { data, error, isLoading, isRefetching, refetch } =
    useCurrentClientOrders();
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      void refetch();
      const interval = setInterval(() => setNow(new Date()), 60_000);
      return () => clearInterval(interval);
    }, [refetch]),
  );
  const { current, history } = organizeClientOrders(data ?? [], now);
  const visible = showHistory ? history : current;
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Tus solicitudes</Text>
            <Text style={styles.title}>
              {showHistory ? 'Historial de pedidos' : 'Mis pedidos'}
            </Text>
            <Text style={styles.copy}>
              {showHistory
                ? 'Acá podés consultar tus pedidos anteriores y revisar cómo sigue cada servicio.'
                : 'Tus pedidos de hoy y próximos, del más cercano al más lejano. Consultá los anteriores en Historial.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Historial de pedidos: ${data ? history.length : 'cargando'}`}
              accessibilityState={{ selected: showHistory }}
              onPress={() => setShowHistory(!showHistory)}
              style={[
                styles.historyButton,
                showHistory && styles.historySelected,
              ]}
            >
              <Ionicons
                name="archive-outline"
                size={18}
                color={colors.accent}
                accessible={false}
              />
              <Text style={styles.link}>Historial</Text>
              <Text style={styles.count}>{data ? history.length : '—'}</Text>
            </Pressable>
            {showHistory ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowHistory(false)}
                style={styles.retry}
              >
                <ActionLabel icon="arrow-back-outline" textStyle={styles.link}>
                  Volver a mis pedidos
                </ActionLabel>
              </Pressable>
            ) : null}
            {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
            {error ? (
              <View style={styles.notice}>
                <Text accessibilityRole="alert" style={styles.error}>
                  No pudimos actualizar tus pedidos.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void refetch()}
                  style={styles.retry}
                >
                  <ActionLabel icon="refresh-outline" textStyle={styles.link}>
                    Reintentar
                  </ActionLabel>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => renderOrder(item)}
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.notice}>
              <Text style={styles.copy}>
                {showHistory
                  ? 'Todavía no tenés pedidos anteriores.'
                  : history.length
                    ? 'No tenés pedidos para hoy o fechas futuras. Podés consultar los anteriores en Historial.'
                    : 'Todavía no tenés pedidos. Buscá un técnico desde Inicio para solicitar un servicio.'}
              </Text>
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 14 },
  header: { paddingTop: 18, gap: 12 },
  eyebrow: {
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '800',
  },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  historySelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(39,180,126,0.1)',
  },
  count: {
    color: colors.accent,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  link: { color: colors.accent, fontWeight: '800' },
  notice: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  retry: { minHeight: 44, justifyContent: 'center' },
  error: { color: '#ff8d87', lineHeight: 22 },
});
