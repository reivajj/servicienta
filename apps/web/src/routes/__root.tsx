import { createRootRoute } from '@tanstack/react-router';
import { AppShell } from '../features/auth/components/AppShell';
import { AuthProvider } from '../features/auth/components/AuthProvider';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
