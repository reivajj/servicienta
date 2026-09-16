import { createFileRoute } from '@tanstack/react-router';
import { SignupPage } from '../features/auth/components/LoginPage';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});
