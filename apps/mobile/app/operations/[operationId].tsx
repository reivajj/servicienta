import { Stack, useLocalSearchParams } from 'expo-router';
import { MobileAccess } from '@/features/auth/MobileAccess';
import { OperationDetailScreen } from '@/features/operations/OperationDetailScreen';
import { colors } from '@/theme/colors';

export default function OperationDetailRoute() {
  const { operationId, focusCompletion } = useLocalSearchParams<{
    operationId: string;
    focusCompletion?: string;
  }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Detalle de la visita',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <MobileAccess>
        <OperationDetailScreen
          key={`${operationId}:${focusCompletion ?? ''}`}
          operationId={operationId}
          focusCompletion={focusCompletion === 'true'}
        />
      </MobileAccess>
    </>
  );
}
