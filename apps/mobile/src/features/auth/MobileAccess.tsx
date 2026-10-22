import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCurrentUser } from '@servicienta/query-hooks';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { useAuth } from './AuthProvider';
import { colors } from '@/theme/colors';

export function MobileAccess({ children }: PropsWithChildren) {
  const { isLoading, session } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return <AuthenticatedMobileAccess>{children}</AuthenticatedMobileAccess>;
}

function AuthenticatedMobileAccess({ children }: PropsWithChildren) {
  const { signOut } = useAuth();
  const { data: currentUser, error, isLoading, refetch } = useCurrentUser();

  if (isLoading) return <AuthLoadingScreen />;

  if (error || !currentUser) {
    return (
      <AccessState
        title="No pudimos verificar tu usuario"
        description={
          error instanceof Error
            ? error.message
            : 'El gateway no devolvió el usuario actual.'
        }
        primaryLabel="Reintentar"
        onPrimary={() => void refetch()}
        onSignOut={() => void signOut()}
      />
    );
  }

  if (currentUser.role !== 'technician' && currentUser.role !== 'client') {
    return (
      <AccessState
        title="Esta versión es para clientes y técnicos"
        description="Ingresá con una cuenta de cliente o técnico para usar la app."
        onSignOut={() => void signOut()}
      />
    );
  }

  return <>{children}</>;
}

function AccessState({
  description,
  onPrimary,
  onSignOut,
  primaryLabel,
  title,
}: {
  description: string;
  onPrimary?: () => void;
  onSignOut: () => void;
  primaryLabel?: string;
  title: string;
}) {
  return (
    <View style={styles.accessScreen}>
      <Text style={styles.accessTitle}>{title}</Text>
      <Text style={styles.accessDescription}>{description}</Text>
      {onPrimary && primaryLabel ? (
        <Pressable onPress={onPrimary} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onSignOut} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  accessScreen: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    backgroundColor: colors.background,
  },
  accessTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  accessDescription: {
    marginBottom: 8,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    color: colors.text,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '800',
  },
});
