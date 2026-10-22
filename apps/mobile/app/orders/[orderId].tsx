import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { MobileAccess } from '@/features/auth/MobileAccess';
import { OrderDetailScreen } from '@/features/orders/OrderDetailScreen';
import { colors } from '@/theme/colors';

export default function OrderDetailRoute() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Detalle del pedido',
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver y cerrar detalle del pedido"
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/(technician)/orders');
              }}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.text}
                accessible={false}
              />
            </Pressable>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <MobileAccess>
        <OrderDetailScreen key={orderId} orderId={orderId} />
      </MobileAccess>
    </>
  );
}
