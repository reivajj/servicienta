import { useCurrentUser } from '@servicienta/query-hooks';
import { TodayScreen } from '@/features/today/TodayScreen';
import { ClientHomeScreen } from '@/features/home/ClientHomeScreen';

export default function HomeRoute() {
  const { data: user } = useCurrentUser();
  return user?.role === 'client' ? <ClientHomeScreen /> : <TodayScreen />;
}
