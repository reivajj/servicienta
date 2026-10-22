import { useCurrentUser } from '@servicienta/query-hooks';
import { TodayScreen } from '@/features/today/TodayScreen';
import { TechnicianSearchScreen } from '@/features/search/TechnicianSearchScreen';

export default function HomeRoute() {
  const { data: user } = useCurrentUser();
  return user?.role === 'client' ? <TechnicianSearchScreen /> : <TodayScreen />;
}
