import { Stack, useLocalSearchParams } from 'expo-router';
import { MobileAccess } from '@/features/auth/MobileAccess';
import { ClientDetailScreen } from '@/features/profile/ClientDetailScreen';
import { colors } from '@/theme/colors';

export default function ClientDetailRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Detalle del cliente',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <MobileAccess>
        <ClientDetailScreen key={orderId} orderId={orderId} />
      </MobileAccess>
    </>
  );
}
