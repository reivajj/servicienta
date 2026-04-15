import { Link, Navigate, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '../../../lib/supabase';
import { useAuth } from './AuthProvider';

export function ResetPasswordPage() {
  const supabase = getSupabaseBrowserClient();
  const navigate = useNavigate();
  const { isLoading, session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isLoading && !session) {
    return <Navigate to="/login" />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim()) {
      setMessage('Ingresa una password valida.');
      return;
    }

    if (password.length < 8) {
      setMessage('La password debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Las passwords no coinciden.');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    setIsSuccess(true);
    setMessage('Password actualizada. Volve a ingresar con la nueva credencial.');
    setIsSubmitting(false);
  }

  if (isSuccess) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-card__eyebrow">Recuperacion</p>
          <h1>Password actualizada</h1>
          <p className="auth-card__copy">
            Ya podes ingresar otra vez con tu email y la nueva password.
          </p>
          <p className="auth-card__message">{message}</p>
          <button
            type="button"
            onClick={() => void navigate({ to: '/login' })}
          >
            Ir al login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-card__eyebrow">Recuperacion</p>
        <h1>Nueva password</h1>
        <p className="auth-card__copy">
          Defini una nueva password para completar la recuperacion de acceso.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span>Nueva password</span>
            <div className="auth-form__password">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="Minimo 8 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="auth-form__toggle"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={isPasswordVisible ? 'Ocultar password' : 'Mostrar password'}
                title={isPasswordVisible ? 'Ocultar password' : 'Mostrar password'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="auth-form__toggle-icon">
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

          <label className="auth-form__field">
            <span>Confirmar password</span>
            <div className="auth-form__password">
              <input
                type={isConfirmPasswordVisible ? 'text' : 'password'}
                placeholder="Repeti la nueva password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <button
                type="button"
                className="auth-form__toggle"
                onClick={() => setIsConfirmPasswordVisible((visible) => !visible)}
                aria-label={isConfirmPasswordVisible ? 'Ocultar password repetida' : 'Mostrar password repetida'}
                title={isConfirmPasswordVisible ? 'Ocultar password repetida' : 'Mostrar password repetida'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="auth-form__toggle-icon">
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
                  {isConfirmPasswordVisible ? (
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
            {isSubmitting ? 'Actualizando...' : 'Guardar nueva password'}
          </button>
        </form>

        <p className="auth-card__message">{message || ' '}</p>

        <Link to="/login" className="users-inline-link">
          Volver al login
        </Link>
      </section>
    </main>
  );
}
