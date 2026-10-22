import { useCurrentUser } from '@servicienta/query-hooks';
import { TechnicianProfileScreen } from '@/features/profile/TechnicianProfileScreen';
import { ClientAccountScreen } from '@/features/profile/ClientAccountScreen';

export default function ProfileRoute() {
  const { data: user } = useCurrentUser();
  return user?.role === 'client' ? (
    <ClientAccountScreen />
  ) : (
    <TechnicianProfileScreen />
  );
}
