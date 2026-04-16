import { createFileRoute } from '@tanstack/react-router';
import { SupabaseDiagnosticsPage } from '../features/supabase-diagnostics/components/SupabaseDiagnosticsPage';

export const Route = createFileRoute('/dev/supabase')({
  component: SupabaseDiagnosticsPage,
});
