import { Redirect } from 'expo-router';
import { AuthLoadingScreen } from '@/features/auth/AuthLoadingScreen';
import { useAuth } from '@/features/auth/AuthProvider';

export default function IndexRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return <Redirect href="/(technician)/today" />;
}
