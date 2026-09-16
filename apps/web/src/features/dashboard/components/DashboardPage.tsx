import { Link } from '@tanstack/react-router';
import type { Operation, Order, User } from '@servicienta/types';
import { useAdminOperations, useAdminOrders, useAdminTechnicianProfiles, useClientProfiles, useCurrentOperations, useCurrentOrders, useCurrentUser, useUsers } from '@servicienta/query-hooks';
import { UsersTable } from '../../users/components/UsersTable';
import { ViewOrderActionLink } from '../../shared/components/ViewOrderActionLink';
import { ViewOperationActionLink } from '../../shared/components/ViewOperationActionLink';
import { formatOperationStatus, formatOrderStatus } from '../../shared/utils/operation-status';

type DashboardRoute = '/orders' | '/operations' | '/users' | '/client-profiles' | '/technician-profiles';

function Card({ to, title, count, copy }: { to: DashboardRoute; title: string; count: number; copy: string }) {
  return <Link to={to} className="dashboard-summary-card"><span>{title}</span><strong>{count}</strong><small>{copy}</small></Link>;
}

function CurrentDashboard({ role }: { role: 'client' | 'technician' }) {
  const { data: orders } = useCurrentOrders({ page: 1, pageSize: 25 });
  const { data: operations } = useCurrentOperations({ page: 1, pageSize: 25 });
  const { data: scheduledOperations, error: scheduledOperationsError, isLoading: isLoadingScheduledOperations } = useCurrentOperations({ page: 1, pageSize: 100, status: 'scheduled' });
  const title = role === 'technician' ? 'Panel del técnico' : 'Panel del cliente';
  const now = Date.now();
  const nextOperation = scheduledOperations?.items
    .filter((operation) => operation.scheduled_at && new Date(operation.scheduled_at).getTime() >= now)
    .sort((left, right) => new Date(left.scheduled_at!).getTime() - new Date(right.scheduled_at!).getTime())[0];
  return (
    <>
      <header className="dashboard-hero">
        <p>{title}</p>
        <h1>Resumen operativo</h1>
        <span>Pedidos y visitas recientes en un solo lugar.</span>
      </header>
      <section className="dashboard-summary-grid">
        <Card to="/orders" title="Pedidos" count={orders?.summary.totalOrders ?? 0} copy={`${orders?.summary.pendingOrders ?? 0} pendientes`} />
        <div className="dashboard-summary-card dashboard-summary-card--visits">
          <Link to="/operations" className="dashboard-summary-card__overview">
            <span>Visitas</span>
            <strong>{operations?.summary.totalOperations ?? 0}</strong>
            <small>{operations?.summary.scheduledOperations ?? 0} agendadas</small>
          </Link>
          {nextOperation ? (
            <Link
              to="/operations/$operationId"
              params={{ operationId: nextOperation.id }}
              className="dashboard-next-visit"
              aria-label={`Ver próxima visita del ${formatDateTime(nextOperation.scheduled_at)}`}
            >
              <span className="dashboard-next-visit__heading">Próxima visita <span aria-hidden="true">↗</span></span>
              <strong>{formatDateTime(nextOperation.scheduled_at)}</strong>
              <span>{role === 'technician'
                ? formatName(nextOperation.client_name, nextOperation.client_surname, nextOperation.client_email ?? 'Cliente')
                : formatName(nextOperation.technician_name, nextOperation.technician_surname, nextOperation.technician_email ?? 'Técnico')}
              </span>
              <small>{nextOperation.service_address_text ?? 'Dirección sin definir'}</small>
              <span className={`status-badge status-badge--${nextOperation.status}`}>{formatOperationStatus(nextOperation.status)}</span>
            </Link>
          ) : (
            <div className="dashboard-next-visit dashboard-next-visit--empty">
              {isLoadingScheduledOperations
                ? 'Buscando próxima visita…'
                : scheduledOperationsError
                  ? 'No se pudo cargar la próxima visita.'
                  : 'No hay una próxima visita agendada.'}
            </div>
          )}
        </div>
      </section>
      <div className="dashboard-operational-tables">
        <RecentOrdersTable orders={orders?.items.slice(0, 5)} role={role} />
        <RecentOperationsTable operations={operations?.items.filter((item) => item.scheduled_at).slice(0, 5)} role={role} />
      </div>
    </>
  );
}

function formatName(name: string | null, surname: string | null, fallback: string) {
  return `${name ?? ''} ${surname ?? ''}`.trim() || fallback;
}

function formatDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : 'Sin definir';
}

function RecentOrdersTable({ orders, role }: { orders?: Order[]; role: 'client' | 'technician' }) {
  return (
    <section className="dashboard-section dashboard-section--wide">
      <div className="dashboard-section__header"><h2>Pedidos recientes</h2><Link to="/orders">Ver todos</Link></div>
      {orders ? orders.length ? (
        <div className="users-table-wrapper"><table className="users-table"><thead><tr><th>Acción</th><th>Estado</th><th>{role === 'technician' ? 'Cliente' : 'Técnico'}</th><th>Dirección</th><th>Problema</th><th>Zona</th><th>Creado el</th></tr></thead><tbody>
          {orders.map((order) => <tr key={order.id}><td><ViewOrderActionLink orderId={order.id} /></td><td><span className={`status-badge status-badge--${order.status}`}>{formatOrderStatus(order.status)}</span></td><td>{role === 'technician' ? formatName(order.client_name, order.client_surname, 'Cliente') : formatName(order.technician_name, order.technician_surname, 'Sin técnico')}</td><td>{order.service_address_text}</td><td>{order.description}</td><td>{order.zone_slug ?? 'Sin definir'}</td><td>{formatDateTime(order.created_at)}</td></tr>)}
        </tbody></table></div>
      ) : <p className="users-message">Todavía no hay pedidos.</p> : <p className="users-message">Cargando pedidos…</p>}
    </section>
  );
}

function RecentOperationsTable({ operations, role }: { operations?: Operation[]; role: 'client' | 'technician' }) {
  return (
    <section className="dashboard-section dashboard-section--wide">
      <div className="dashboard-section__header"><h2>Visitas programadas</h2><Link to="/operations">Ver todas</Link></div>
      {operations ? operations.length ? (
        <div className="users-table-wrapper"><table className="users-table"><thead><tr><th>Acción</th><th>Estado</th><th>{role === 'technician' ? 'Cliente' : 'Técnico'}</th><th>Programada</th><th>Dirección</th><th>Descripción</th><th>Reseña</th></tr></thead><tbody>
          {operations.map((operation) => <tr key={operation.id}><td><ViewOperationActionLink operationId={operation.id} /></td><td><span className={`status-badge status-badge--${operation.status}`}>{formatOperationStatus(operation.status)}</span></td><td>{role === 'technician' ? formatName(operation.client_name, operation.client_surname, operation.client_email ?? 'Cliente') : formatName(operation.technician_name, operation.technician_surname, operation.technician_email ?? 'Técnico')}</td><td>{formatDateTime(operation.scheduled_at)}</td><td>{operation.service_address_text ?? 'Sin definir'}</td><td>{operation.description ?? 'Sin definir'}</td><td>{operation.technician_review ? `${operation.technician_review.rating}/5` : 'Sin reseña'}</td></tr>)}
        </tbody></table></div>
      ) : <p className="users-message">Todavía no hay visitas programadas.</p> : <p className="users-message">Cargando visitas…</p>}
    </section>
  );
}

function RecentUsersTable({ users }: { users?: User[] }) {
  return <section className="dashboard-section dashboard-section--wide"><div className="dashboard-section__header"><h2>Usuarios recientes</h2><Link to="/users">Ver todos</Link></div>{users ? <UsersTable users={users} /> : <p>Cargando usuarios…</p>}</section>;
}

function AdminDashboard() {
  const { data: users } = useUsers({ page: 1, pageSize: 25 });
  const { data: clients } = useClientProfiles({ page: 1, pageSize: 25 });
  const { data: technicians } = useAdminTechnicianProfiles({ page: 1, pageSize: 25 });
  const { data: orders } = useAdminOrders({ page: 1, pageSize: 25 });
  const { data: operations } = useAdminOperations({ page: 1, pageSize: 25 });
  return <><header className="dashboard-hero"><p>Administración</p><h1>Panel de control</h1><span>Accesos rápidos y estado general de la operación.</span></header><section className="dashboard-summary-grid dashboard-summary-grid--admin"><Card to="/operations" title="Visitas" count={operations?.summary.totalOperations ?? 0} copy={`${operations?.summary.scheduledOperations ?? 0} agendadas`} /><Card to="/orders" title="Pedidos" count={orders?.summary.totalOrders ?? 0} copy={`${orders?.summary.pendingOrders ?? 0} pendientes`} /><Card to="/users" title="Usuarios" count={users?.summary.totalUsers ?? 0} copy={`${users?.summary.activeUsers ?? 0} activos`} /><Card to="/client-profiles" title="Clientes" count={clients?.summary.totalClients ?? 0} copy={`${clients?.summary.activeClients ?? 0} activos`} /><Card to="/technician-profiles" title="Técnicos" count={technicians?.summary.totalTechnicians ?? 0} copy={`${technicians?.summary.availableTechnicians ?? 0} disponibles`} /></section><RecentUsersTable users={users?.items.slice(0, 6)} /></>;
}

export function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();
  return <main className="dashboard-page dashboard-page--operational">{isLoading ? <p>Cargando panel…</p> : user?.role === 'admin' ? <AdminDashboard /> : <CurrentDashboard role={user?.role === 'technician' ? 'technician' : 'client'} />}</main>;
}
