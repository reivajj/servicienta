import { Navigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getSupabaseBrowserClient } from '../../../lib/supabase'
import { useAuth } from './AuthProvider'

export function LoginPage() {
  const supabase = getSupabaseBrowserClient()
  const { isLoading, session } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && session) {
    return <Navigate to="/dashboard" />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      setMessage('Ingresa un email valido')
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    setMessage(error ? `Error: ${error.message}` : 'Revisa tu email para entrar')
    setIsSubmitting(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-card__eyebrow">Acceso</p>
        <h1>Ingresar</h1>
        <p className="auth-card__copy">
          Envia un magic link a tu correo para entrar a la plataforma.
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

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar magic link'}
          </button>
        </form>

        <p className="auth-card__message">{message || ' '}</p>
      </section>
    </main>
  )
}
