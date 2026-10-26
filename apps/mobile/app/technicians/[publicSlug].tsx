import { Stack, useLocalSearchParams } from 'expo-router';
import { MobileAccess } from '@/features/auth/MobileAccess';
import { PublicTechnicianScreen } from '@/features/profile/PublicTechnicianScreen';
import { colors } from '@/theme/colors';

export default function PublicTechnicianRoute() {
  const { publicSlug } = useLocalSearchParams<{ publicSlug: string }>();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Perfil del técnico',
          headerBackTitle: 'Atrás',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <MobileAccess>
        <PublicTechnicianScreen key={publicSlug} publicSlug={publicSlug} />
      </MobileAccess>
    </>
  );
}
