import { Link, Navigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useCompleteClientOnboarding } from '@servicienta/query-hooks';
import { getSupabaseBrowserClient } from '../../../lib/supabase';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  return <AuthPage authMode="login" />;
}

export function SignupPage() {
  return <AuthPage authMode="signup" />;
}

function AuthPage({ authMode }: { authMode: 'login' | 'signup' }) {
  const supabase = getSupabaseBrowserClient();
  const { isLoading, session } = useAuth();
  const completeClientOnboarding = useCompleteClientOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  if (!isLoading && session && !isSubmitting && !needsOnboarding) {
    return <Navigate to="/dashboard" />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage('Ingresá un email válido.');
      return;
    }

    if (!password.trim()) {
      setMessage('Ingresá una contraseña.');
      return;
    }

    if (authMode === 'signup') {
      if (!name.trim() || !surname.trim()) {
        setMessage('Nombre y apellido son obligatorios.');
        return;
      }
      if (password.length < 8) {
        setMessage('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setMessage('Las contraseñas no coinciden.');
        return;
      }
    }

    setIsSubmitting(true);
    setMessage('');
    setIsSuccessMessage(false);

    try {
      if (authMode === 'signup') {
        if (!needsOnboarding) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { name: name.trim(), surname: surname.trim(), role: 'client' } },
          });
          if (error) throw error;
          if (!data.session) {
            setMessage('Cuenta creada. Revisá tu correo para confirmarla antes de ingresar.');
            setIsSuccessMessage(true);
            return;
          }
          setNeedsOnboarding(true);
        }

        await completeClientOnboarding.mutateAsync({
          name: name.trim(),
          surname: surname.trim(),
          phone: null,
          whatsapp_phone: null,
          default_address_text: null,
          address_notes: null,
          preferred_contact_channel: 'phone',
        });
        setNeedsOnboarding(false);
        setMessage('Cuenta creada correctamente.');
        setIsSuccessMessage(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setMessage('Ingreso correcto.');
        setIsSuccessMessage(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo completar la operación.');
    } finally {
      setIsSubmitting(false);
    }
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
    setIsSuccessMessage(!error);
    setIsResetSubmitting(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-card__eyebrow">{authMode === 'signup' ? 'Registro' : 'Acceso'}</p>
        <h1>{authMode === 'signup' ? 'Crear cuenta' : 'Ingresar'}</h1>
        <p className="auth-card__copy">
          {authMode === 'signup'
            ? 'Creá tu cuenta de cliente para gestionar pedidos y visitas.'
            : 'Ingresá con tu email y contraseña.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {authMode === 'signup' ? <>
            <label className="auth-form__field"><span>Nombre</span><input type="text" value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label className="auth-form__field"><span>Apellido</span><input type="text" value={surname} onChange={(event) => setSurname(event.target.value)} required /></label>
          </> : null}
          <label className="auth-form__field">
            <span>Email</span>
            <input
              type="email"
              required
              placeholder="tu-email@ejemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth-form__field">
            <span>Contraseña</span>
            <div className="auth-form__password">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="Tu contraseña"
                required
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

          {authMode === 'signup' ? (
            <label className="auth-form__field">
              <span>Confirmar contraseña</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </label>
          ) : null}

          <div className="auth-form__actions">
            <button type="submit" className="auth-form__primary-action" disabled={isSubmitting}>
              {isSubmitting ? (authMode === 'signup' ? 'Creando cuenta...' : 'Ingresando...') : authMode === 'signup' ? (needsOnboarding ? 'Completar registro' : 'Crear cuenta') : 'Ingresar'}
            </button>
            {authMode === 'login' ? <button
              type="button"
              className="auth-card__secondary-action"
              onClick={handleForgotPassword}
              disabled={isResetSubmitting}
            >
              {isResetSubmitting ? 'Enviando enlace...' : 'Olvidé mi contraseña'}
            </button> : null}
          </div>
        </form>

        <Link to={authMode === 'login' ? '/signup' : '/login'} className="auth-card__register-action">
          {authMode === 'login' ? '¿No tenés cuenta? Crear usuario' : 'Ya tengo cuenta: ingresar'}
        </Link>

        <p className={`auth-card__message${isSuccessMessage ? ' auth-card__message--success' : ''}`} role="status">{message || ' '}</p>
      </section>
    </main>
  );
}
