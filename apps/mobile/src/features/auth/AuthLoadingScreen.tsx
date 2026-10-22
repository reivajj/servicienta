import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function AuthLoadingScreen() {
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.text}>Verificando sesión…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
});
