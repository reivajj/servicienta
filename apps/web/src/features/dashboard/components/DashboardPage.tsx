import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMe, useUpdateMe } from '@servicienta/query-hooks'
import type { UserRole } from '@servicienta/types'
import { useAuth } from '../../auth/components/AuthProvider'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: me, error, isLoading } = useMe()
  const updateMe = useUpdateMe()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [role, setRole] = useState<UserRole>('client')

  useEffect(() => {
    if (!me) {
      return
    }

    setName(me.name ?? '')
    setSurname(me.surname ?? '')
    setRole(me.role)
  }, [me])

  const errorMessage = error instanceof Error ? error.message : ''
  const mutationError =
    updateMe.error instanceof Error ? updateMe.error.message : ''

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await updateMe.mutateAsync({ name, surname, role })
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <p className="dashboard-card__eyebrow">Dashboard</p>
        <h1>Sesion activa</h1>
        <p className="dashboard-card__copy">
          Entraste correctamente con Supabase.
        </p>

        <dl className="dashboard-card__meta">
          <div>
            <dt>Email</dt>
            <dd>{user?.email ?? 'Sin email'}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{user?.id ?? 'No disponible'}</dd>
          </div>
          <div>
            <dt>Perfil actual</dt>
            <dd>
              {isLoading
                ? 'Cargando perfil...'
                : me
                  ? `${me.name ?? 'Sin nombre'} ${me.surname ?? ''}`.trim() ||
                    'Sin datos'
                  : 'Sin perfil'}
            </dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{me?.role ?? 'No disponible'}</dd>
          </div>
        </dl>

        {errorMessage ? (
          <p className="auth-card__message">{errorMessage}</p>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span>Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="auth-form__field">
            <span>Apellido</span>
            <input
              type="text"
              value={surname}
              onChange={(event) => setSurname(event.target.value)}
            />
          </label>

          <label className="auth-form__field">
            <span>Rol</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="client">Client</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button type="submit" disabled={updateMe.isPending}>
            {updateMe.isPending ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>

        <p className="auth-card__message">
          {mutationError
            ? mutationError
            : updateMe.isSuccess
              ? 'Perfil actualizado'
              : ' '}
        </p>

        <Link to="/dev/supabase" className="dashboard-card__link">
          Ir al diagnostico tecnico
        </Link>
      </section>
    </main>
  )
}
