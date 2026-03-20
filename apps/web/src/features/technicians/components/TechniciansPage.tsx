import { useTechnicians } from '@servicienta/query-hooks'

export function TechniciansPage() {
  const { data: technicians = [], error, isLoading } = useTechnicians()
  const errorMessage = error instanceof Error ? error.message : ''

  return (
    <main className="technicians-page">
      <section className="technicians-page__hero">
        <p className="technicians-page__eyebrow">Marketplace</p>
        <h1>Tecnicos de prueba</h1>
        <p className="technicians-page__copy">
          Esta ruta ya consume el flujo final via query hooks, api client y api
          gateway.
        </p>
      </section>

      {isLoading ? (
        <section className="state-card">
          <h2>Cargando tecnicos</h2>
          <p>Consultando `GET /api/technicians`.</p>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="state-card">
          <h2>No se pudo cargar la tabla</h2>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {!isLoading && !errorMessage && technicians.length === 0 ? (
        <section className="state-card">
          <h2>No hay tecnicos cargados</h2>
          <p>La API respondio correctamente pero no devolvio registros.</p>
        </section>
      ) : null}

      {!isLoading && !errorMessage && technicians.length > 0 ? (
        <section className="technicians-grid">
          {technicians.map((technician) => (
            <article key={technician.id} className="technician-card">
              <div className="technician-card__availability">
                {technician.is_available ? 'Disponible' : 'No disponible'}
              </div>

              <h2>{technician.full_name}</h2>
              <p className="technician-card__specialty">
                {technician.specialty}
              </p>

              <dl className="technician-card__meta">
                <div>
                  <dt>Ciudad</dt>
                  <dd>{technician.city}</dd>
                </div>
                <div>
                  <dt>Bio</dt>
                  <dd>{technician.bio ?? 'Sin descripcion cargada'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}
