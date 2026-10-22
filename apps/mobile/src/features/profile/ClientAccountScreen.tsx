import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser } from '@servicienta/query-hooks';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatPersonName } from '@/lib/format';
import { colors } from '@/theme/colors';

export function ClientAccountScreen() {
  const { data: user } = useCurrentUser();
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await signOut();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'No se pudo cerrar sesión.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Cuenta de cliente</Text>
        <Text style={styles.title}>Mi perfil</Text>
        <View style={styles.card}>
          <Text style={styles.name}>
            {formatPersonName(user?.name ?? null, user?.surname ?? null)}
          </Text>
          <Text style={styles.copy}>{user?.email}</Text>
        </View>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={pending}
          onPress={() => void logout()}
          style={styles.button}
        >
          {pending ? <ActivityIndicator color={colors.text} /> : null}
          <Text style={styles.name}>
            {pending ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 20 },
  eyebrow: { color: colors.accent, fontWeight: '900', fontSize: 12 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
  card: {
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  copy: { color: colors.muted, lineHeight: 22 },
  error: { color: '#ff8d87' },
  button: {
    minHeight: 52,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
