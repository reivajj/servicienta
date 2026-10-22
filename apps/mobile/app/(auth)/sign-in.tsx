import { Redirect } from 'expo-router';
import { AuthLoadingScreen } from '@/features/auth/AuthLoadingScreen';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { useAuth } from '@/features/auth/AuthProvider';

export default function SignInRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (session) return <Redirect href="/" />;

  return <SignInScreen />;
}
