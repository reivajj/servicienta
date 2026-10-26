import { ActionLabel } from '@/components/ActionLabel';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCurrentScheduledOperations } from '@servicienta/query-hooks';
import { OperationCard } from '@/features/operations/OperationsScreen';
import { TechnicianSearchScreen } from '@/features/search/TechnicianSearchScreen';
import { AGENDA_TIME_ZONE } from '@/features/today/agenda';
import { colors } from '@/theme/colors';
import { upcomingClientVisits } from './visits';

export function ClientHomeScreen() {
  const router = useRouter();
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
  const visits = upcomingClientVisits(data ?? [], now);
  const nextVisit = visits[0];

  return (
    <TechnicianSearchScreen
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      header={
        <>
          {isLoading ? (
            <View style={styles.notice}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.copy}>Buscando tus visitas programadas…</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.notice}>
              <Text accessibilityRole="alert" style={styles.error}>
                No pudimos actualizar tus visitas programadas.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void refetch()}
                style={styles.linkButton}
              >
                <ActionLabel icon="refresh-outline" textStyle={styles.link}>
                  Reintentar
                </ActionLabel>
              </Pressable>
            </View>
          ) : null}
          {nextVisit ? (
            <View style={styles.section}>
              <View style={styles.heading}>
                <Ionicons
                  name="calendar-outline"
                  size={26}
                  color={colors.accent}
                  accessible={false}
                />
                <Text accessibilityRole="header" style={styles.title}>
                  Tu próxima visita
                </Text>
              </View>
              <Text style={styles.copy}>
                Tenés una visita programada con tu técnico.
              </Text>
              <View style={styles.featured}>
                <OperationCard
                  operation={nextVisit}
                  timeZone={AGENDA_TIME_ZONE}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(technician)/visits')}
                style={styles.linkButton}
              >
                <ActionLabel icon="calendar-outline" textStyle={styles.link}>
                  {visits.length > 1
                    ? `Ver mis ${visits.length} visitas programadas`
                    : 'Ver mis visitas'}
                </ActionLabel>
              </Pressable>
              <View style={styles.divider} />
            </View>
          ) : null}
        </>
      }
    />
  );
}
const styles = StyleSheet.create({
  section: { gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, color: colors.text, fontSize: 26, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  featured: { borderWidth: 2, borderColor: colors.accent, borderRadius: 22 },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: 8,
  },
  link: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 15,
    flexShrink: 1,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  notice: {
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  error: { color: '#ff8d87', lineHeight: 22 },
});
