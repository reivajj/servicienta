import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { colors } from '@/theme/colors';

/** Shared text + trailing icon for action buttons; the Pressable owns accessibility. */
export function ActionLabel({
  children,
  icon,
  textStyle,
}: {
  children: ReactNode;
  icon: ComponentProps<typeof Ionicons>['name'];
  textStyle?: StyleProp<TextStyle>;
}) {
  const textColor = StyleSheet.flatten(textStyle)?.color;
  const color =
    typeof textColor === 'number' ? colors.text : (textColor ?? colors.text);
  return (
    <View style={styles.row}>
      <Text style={[styles.text, textStyle]}>{children}</Text>
      <Ionicons name={icon} size={22} color={color} accessible={false} />
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexShrink: 1,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
});
