import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { ActivityEventsListPage } from '../features/activity-events/components/ActivityEventsListPage';

export const Route = createFileRoute('/activity-events/')({
  component: ActivityEventsRoute,
});

function ActivityEventsRoute() {
  return (
    <RequireAuth>
      <ActivityEventsListPage />
    </RequireAuth>
  );
}
