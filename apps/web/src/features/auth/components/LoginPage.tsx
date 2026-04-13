import { Navigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getSupabaseBrowserClient } from '../../../lib/supabase'
import { useAuth } from './AuthProvider'

export function LoginPage() {
  const supabase = getSupabaseBrowserClient()
  const { isLoading, session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    if (!password.trim()) {
      setMessage('Ingresa una password valida')
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setMessage(error ? `Error: ${error.message}` : 'Login exitoso')
    setIsSubmitting(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-card__eyebrow">Acceso</p>
        <h1>Ingresar</h1>
        <p className="auth-card__copy">
          Ingresá con email y password para probar usuarios creados en Supabase Auth.
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
            <input
              type="password"
              placeholder="Tu password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-card__message">{message || ' '}</p>
      </section>
    </main>
  )
}
