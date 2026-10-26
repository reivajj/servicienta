import { ActionLabel } from '@/components/ActionLabel';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentClientVisits } from '@servicienta/query-hooks';
import type { Operation } from '@servicienta/types';
import { colors } from '@/theme/colors';
import { organizeClientVisits } from './client-visits';

export function ClientVisitsScreen({
  renderVisit,
}: {
  renderVisit: (
    visit: Operation,
    highlighted: boolean,
    now: number,
  ) => ReactElement;
}) {
  const { data, error, isLoading, isRefetching, refetch } =
    useCurrentClientVisits();
  const [showHistory, setShowHistory] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      void refetch();
      const interval = setInterval(() => setNow(Date.now()), 60_000);
      return () => clearInterval(interval);
    }, [refetch]),
  );
  const { featured, sections, history } = organizeClientVisits(
    data ?? [],
    new Date(now),
  );
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <SectionList
        sections={
          showHistory
            ? history.length
              ? [{ title: 'Visitas anteriores', data: history }]
              : []
            : sections
        }
        keyExtractor={(item) => item.id}
        extraData={now}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Tus servicios</Text>
            <Text style={styles.title}>
              {showHistory ? 'Historial de visitas' : 'Mis visitas'}
            </Text>
            <Text style={styles.copy}>
              {showHistory
                ? 'Acá encontrás tus visitas anteriores, incluidas las que todavía tienen una confirmación u opinión pendiente.'
                : 'Revisá tu visita más reciente y las próximas visitas programadas.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Historial de visitas: ${data ? history.length : 'cargando'}`}
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
              <Text style={styles.historyCount}>
                {data ? history.length : '—'}
              </Text>
            </Pressable>
            {showHistory ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowHistory(false)}
                style={styles.retry}
              >
                <ActionLabel icon="arrow-back-outline" textStyle={styles.link}>
                  Volver a mis visitas
                </ActionLabel>
              </Pressable>
            ) : null}
            {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
            {error ? (
              <View style={styles.notice}>
                <Text accessibilityRole="alert" style={styles.error}>
                  No pudimos actualizar tus visitas.
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
        renderSectionHeader={({ section }) => (
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) =>
          !showHistory && item.id === featured?.id ? (
            <View style={styles.featured}>
              <Text style={styles.featuredTitle}>
                {item.status === 'completed_tech'
                  ? 'Tu visita está lista para confirmar'
                  : item.status === 'completed'
                    ? 'Tu opinión está pendiente'
                    : 'Tené en cuenta esta visita'}
              </Text>
              {renderVisit(item, true, now)}
            </View>
          ) : (
            renderVisit(item, false, now)
          )
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.notice}>
              <Text style={styles.copy}>
                {showHistory
                  ? 'Todavía no tenés visitas anteriores.'
                  : history.length
                    ? 'No tenés nuevas visitas por el momento. Podés consultar las anteriores en Historial.'
                    : 'Todavía no tenés visitas. Cuando coordines un servicio, lo vas a encontrar acá.'}
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
  header: { gap: 12, paddingTop: 18 },
  eyebrow: {
    color: colors.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  historyCount: {
    color: colors.accent,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  featured: { gap: 10, paddingTop: 8 },
  featuredTitle: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    paddingTop: 12,
  },
  notice: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  retry: { minHeight: 44, justifyContent: 'center' },
  link: { color: colors.accent, fontWeight: '800' },
  error: { color: '#ff8d87', lineHeight: 22 },
});
