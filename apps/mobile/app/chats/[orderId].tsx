import { MobileAccess } from '@/features/auth/MobileAccess';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ChatThreadScreen } from '@/features/chat/ChatThreadScreen';
import { colors } from '@/theme/colors';

export default function ChatThreadRoute() {
  const { orderId, operationId } = useLocalSearchParams<{
    orderId: string;
    operationId?: string;
  }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chat del pedido',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <MobileAccess>
        <ChatThreadScreen
          key={`${orderId}:${operationId ?? ''}`}
          orderId={orderId}
          operationId={operationId}
        />
      </MobileAccess>
    </>
  );
}
