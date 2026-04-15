import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordPage } from '../features/auth/components/ResetPasswordPage';

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
});
