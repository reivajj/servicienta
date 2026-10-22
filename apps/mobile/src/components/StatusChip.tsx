import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function StatusChip({ children }: PropsWithChildren) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(39, 180, 126, 0.45)',
    borderRadius: 999,
    backgroundColor: 'rgba(39, 180, 126, 0.12)',
  },
  text: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
});
