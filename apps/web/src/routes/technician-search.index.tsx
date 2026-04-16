import { createFileRoute } from '@tanstack/react-router';
import { TechnicianSearchPage } from '../features/technician-profiles/components/TechnicianSearchPage';

export const Route = createFileRoute('/technician-search/')({
  component: TechnicianSearchPage,
});
