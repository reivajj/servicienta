import { Link } from '@tanstack/react-router'
import { useAuth } from '../../auth/components/AuthProvider'

export function DashboardPage() {
  const { user } = useAuth()

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
        </dl>

        <Link to="/dev/supabase" className="dashboard-card__link">
          Ir al diagnostico tecnico
        </Link>
        <Link to="/technicians" className="dashboard-card__link">
          Ver tecnicos
        </Link>
      </section>
    </main>
  )
}
