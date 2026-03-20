import { useState } from 'react'
import { getSupabaseBrowserClient } from '../../../lib/supabase'

export function SupabaseDiagnosticsPage() {
  const supabase = getSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [tableName, setTableName] = useState('')
  const [sessionResult, setSessionResult] = useState<string>('')
  const [otpResult, setOtpResult] = useState<string>('')
  const [queryResult, setQueryResult] = useState<string>('')

  async function handleGetSession() {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      setSessionResult(`Error: ${error.message}`)
      return
    }

    setSessionResult(
      data.session
        ? `OK: hay una sesion activa para ${data.session.user.email ?? 'usuario sin email'}`
        : 'OK: no hay sesion activa',
    )
  }

  async function handleSendOtp() {
    if (!email.trim()) {
      setOtpResult('Error: ingresa un email para probar OTP')
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    })

    setOtpResult(error ? `Error: ${error.message}` : 'OK: revisa tu email')
  }

  async function handleSelectTable() {
    if (!tableName.trim()) {
      setQueryResult('Error: ingresa un nombre de tabla')
      return
    }

    const { data, error } = await supabase
      .from(tableName.trim())
      .select('*')
      .limit(5)

    if (error) {
      setQueryResult(`Error: ${error.message}`)
      return
    }

    setQueryResult(`OK: ${JSON.stringify(data, null, 2)}`)
  }

  return (
    <main className="home-page">
      <div className="home-page__content">
        <p className="home-page__eyebrow">Servicienta</p>
        <h1>Diagnostico de Supabase</h1>
        <p className="home-page__copy">
          Esta pantalla sirve para validar que el cliente compartido funciona,
          que las variables de entorno estan bien y que tu proyecto de Supabase
          responde desde el browser.
        </p>

        <section className="diagnostic-card">
          <h2>Variables de entorno</h2>
          <p>
            URL: <code>{import.meta.env.VITE_SUPABASE_URL}</code>
          </p>
          <p>
            ANON KEY:{' '}
            <code>{import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 12)}...</code>
          </p>
        </section>

        <section className="diagnostic-card">
          <h2>Sesion</h2>
          <button type="button" onClick={handleGetSession}>
            Probar auth.getSession()
          </button>
          <pre>{sessionResult || 'Sin ejecutar'}</pre>
        </section>

        <section className="diagnostic-card">
          <h2>Login por OTP</h2>
          <input
            type="email"
            placeholder="tu-email@ejemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="button" onClick={handleSendOtp}>
            Enviar magic link / OTP
          </button>
          <pre>{otpResult || 'Sin ejecutar'}</pre>
        </section>

        <section className="diagnostic-card">
          <h2>Consulta a tabla</h2>
          <input
            type="text"
            placeholder="nombre_de_tabla"
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
          />
          <button type="button" onClick={handleSelectTable}>
            Probar select *
          </button>
          <pre>{queryResult || 'Sin ejecutar'}</pre>
        </section>
      </div>
    </main>
  )
}
