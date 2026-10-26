import { ActionLabel } from '@/components/ActionLabel';
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePublicTechnicianProfile } from '@servicienta/query-hooks';
import { formatPersonName } from '@/lib/format';
import { AGENDA_TIME_ZONE } from '@/features/today/agenda';
import { colors } from '@/theme/colors';

export function PublicTechnicianScreen({ publicSlug }: { publicSlug: string }) {
  const router = useRouter();
  const {
    data: profile,
    error,
    isLoading,
    refetch,
  } = usePublicTechnicianProfile(publicSlug);
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/(technician)/visits');
  }
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.notice}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.copy}>Cargando perfil del técnico…</Text>
          </View>
        ) : error || !profile ? (
          <View style={styles.card}>
            <Text accessibilityRole="alert" style={styles.error}>
              {error instanceof Error
                ? error.message
                : 'No se pudo cargar el perfil del técnico.'}
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
        ) : (
          <>
            <View style={styles.identity}>
              <Ionicons
                name="person-circle-outline"
                size={64}
                color={colors.accent}
                accessible={false}
              />
              <Text style={styles.title}>
                {formatPersonName(profile.name, profile.surname)}
              </Text>
              {profile.verified_at ? (
                <View style={styles.row}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.accent}
                    accessible={false}
                  />
                  <Text style={styles.verified}>Técnico verificado</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.card}>
              <View style={styles.row}>
                <Ionicons
                  name="star"
                  size={22}
                  color="#dfbc75"
                  accessible={false}
                />
                <Text style={styles.heading}>
                  {profile.rating_count
                    ? `${profile.rating.toFixed(1)} de 5 · ${profile.rating_count} ${profile.rating_count === 1 ? 'opinión' : 'opiniones'}`
                    : 'Todavía sin opiniones'}
                </Text>
              </View>
              <Text style={styles.copy}>
                {profile.available
                  ? 'Disponible para nuevas solicitudes'
                  : 'No está recibiendo nuevas solicitudes'}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Sobre el técnico</Text>
              <Text style={styles.body}>
                {profile.bio ||
                  'El técnico todavía no agregó una presentación.'}
              </Text>
              <Text style={styles.copy}>
                En Servicienta desde{' '}
                {new Intl.DateTimeFormat('es-AR', {
                  timeZone: AGENDA_TIME_ZONE,
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(profile.created_at))}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={back}
          style={styles.button}
        >
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={colors.text}
            accessible={false}
          />
          <Text style={styles.buttonText}>Atrás</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 18 },
  identity: { gap: 12, paddingVertical: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verified: { color: colors.accent, fontWeight: '700' },
  card: {
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  notice: { gap: 14, paddingVertical: 24, alignItems: 'center' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  error: { color: '#ff8d87', lineHeight: 22 },
});
