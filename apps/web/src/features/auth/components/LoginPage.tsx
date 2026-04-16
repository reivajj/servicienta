import { Navigate } from '@tanstack/react-router';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '../../../lib/supabase';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const supabase = getSupabaseBrowserClient();
  const { isLoading, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  if (!isLoading && session) {
    return <Navigate to="/dashboard" />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage('Ingresa un email valido');
      return;
    }

    if (!password.trim()) {
      setMessage('Ingresa una password valida');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setMessage(error ? `Error: ${error.message}` : 'Login exitoso');
    setIsSubmitting(false);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setMessage('Ingresa tu email para enviarte el link de recuperacion');
      return;
    }

    setIsResetSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setMessage(
      error
        ? `Error: ${error.message}`
        : 'Te enviamos un email para restablecer tu password',
    );
    setIsResetSubmitting(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-card__eyebrow">Acceso</p>
        <h1>Ingresar</h1>
        <p className="auth-card__copy">
          Ingresá con email y password para probar usuarios creados en Supabase
          Auth.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span>Email</span>
            <input
              type="email"
              placeholder="tu-email@ejemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth-form__field">
            <span>Password</span>
            <div className="auth-form__password">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="Tu password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="auth-form__toggle"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={
                  isPasswordVisible ? 'Ocultar password' : 'Mostrar password'
                }
                title={
                  isPasswordVisible ? 'Ocultar password' : 'Mostrar password'
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="auth-form__toggle-icon"
                >
                  <path
                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  {isPasswordVisible ? (
                    <path
                      d="M4 20 20 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  ) : null}
                </svg>
              </button>
            </div>
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <button
          type="button"
          className="auth-card__secondary-action"
          onClick={handleForgotPassword}
          disabled={isResetSubmitting}
        >
          {isResetSubmitting ? 'Enviando link...' : 'Me olvide la password'}
        </button>

        <p className="auth-card__message">{message || ' '}</p>
      </section>
    </main>
  );
}
