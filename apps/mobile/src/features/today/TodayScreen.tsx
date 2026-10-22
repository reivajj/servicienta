import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentScheduledOperations } from '@servicienta/query-hooks';
import { OperationCard } from '@/features/operations/OperationsScreen';
import { formatTime } from '@/lib/format';
import { colors } from '@/theme/colors';
import { AGENDA_TIME_ZONE, todayScheduledOperations } from './agenda';

export function TodayScreen() {
  const [now, setNow] = useState(() => new Date());
  const { data, error, isLoading, isRefetching, refetch } =
    useCurrentScheduledOperations();
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      void refetch();
      const interval = setInterval(() => setNow(new Date()), 60_000);
      return () => clearInterval(interval);
    }, [refetch]),
  );

  const visits = todayScheduledOperations(data ?? [], now);
  const nextVisit = visits.find(
    (visit) => Date.parse(visit.scheduled_at!) >= now.getTime(),
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <FlatList
        data={visits}
        keyExtractor={(visit) => visit.id}
        contentContainerStyle={styles.content}
        refreshing={isRefetching}
        onRefresh={() => {
          setNow(new Date());
          void refetch();
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Jornada del técnico</Text>
            <Text style={styles.title}>Hoy</Text>
            <Text style={styles.copy}>Horarios de Argentina</Text>
            {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
            {error ? (
              <View style={styles.notice}>
                <Text accessibilityRole="alert" style={styles.error}>
                  {error instanceof Error
                    ? error.message
                    : 'No pudimos cargar tu agenda.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void refetch()}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Reintentar</Text>
                </Pressable>
              </View>
            ) : null}
            {data ? (
              <Text style={styles.count}>
                {visits.length}{' '}
                {visits.length === 1 ? 'visita agendada' : 'visitas agendadas'}
              </Text>
            ) : null}
            {nextVisit ? (
              <Text style={styles.copy}>
                Próxima visita a las{' '}
                {formatTime(nextVisit.scheduled_at, AGENDA_TIME_ZONE)}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.notice}>
              <Text style={styles.count}>Sin visitas agendadas para hoy</Text>
              <Text style={styles.copy}>
                Podés consultar el resto de tus visitas en la pestaña Visitas.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <OperationCard operation={item} timeZone={AGENDA_TIME_ZONE} today />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 14 },
  header: { gap: 10, paddingTop: 18, marginBottom: 10 },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 36, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  count: { color: colors.text, fontSize: 18, fontWeight: '800' },
  notice: {
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  error: { color: '#ff8d87', lineHeight: 22 },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  buttonText: { color: colors.accent, fontWeight: '800' },
});
