import type { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { mobileEnv } from '@/lib/env';
import { colors } from '@/theme/colors';

interface FoundationScreenProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
}

export function FoundationScreen({
  children,
  description,
  eyebrow,
  title,
}: FoundationScreenProps) {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {!mobileEnv.isConfigured ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Falta configurar el entorno</Text>
          <Text style={styles.noticeText}>
            Copiá apps/mobile/.env.example a apps/mobile/.env y completá las
            variables públicas del gateway y Supabase.
          </Text>
        </View>
      ) : null}

      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  hero: {
    gap: 10,
    paddingTop: 18,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '900',
  },
  description: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  notice: {
    gap: 8,
    marginTop: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  noticeText: {
    color: colors.muted,
    lineHeight: 21,
  },
});
