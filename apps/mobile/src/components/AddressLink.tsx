import type { PropsWithChildren } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { formatSlug } from '@/lib/format';
import { colors } from '@/theme/colors';

export function AddressLink({
  address,
  zone,
  style,
  children,
}: PropsWithChildren<{
  address: string | null;
  zone?: string | null;
  style?: StyleProp<TextStyle>;
}>) {
  const available = Boolean(address?.trim());

  async function openMaps() {
    if (!address?.trim()) return;
    const query = encodeURIComponent(
      [address.trim(), zone ? formatSlug(zone) : null, 'Argentina']
        .filter(Boolean)
        .join(', '),
    );
    const fallback = `https://www.google.com/maps/search/?api=1&query=${query}`;
    const url =
      Platform.OS === 'android'
        ? `geo:0,0?q=${query}`
        : Platform.OS === 'ios'
          ? `maps:?q=${query}`
          : fallback;
    try {
      await Linking.openURL(url);
    } catch {
      try {
        await Linking.openURL(fallback);
      } catch {
        Alert.alert('No se pudo abrir el mapa', 'Volvé a intentarlo.');
      }
    }
  }

  return (
    <Text
      accessibilityRole={available ? 'link' : undefined}
      accessibilityLabel={
        available ? `Abrir dirección en mapas: ${address}` : undefined
      }
      style={[styles.text, style, available && styles.link]}
      onPress={
        available
          ? (event) => {
              event.stopPropagation();
              void openMaps();
            }
          : undefined
      }
    >
      {children ?? address ?? 'Dirección sin definir'}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.text, fontSize: 16, lineHeight: 24 },
  link: { textDecorationLine: 'underline', textDecorationColor: colors.accent },
});
