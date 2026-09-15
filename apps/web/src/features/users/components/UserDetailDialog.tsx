import {
  useDeleteUser,
  useRestoreUser,
  useUpdateUser,
  useUser,
} from '@servicienta/query-hooks';
import type { UserRole, UserStatus } from '@servicienta/types';
import { formatUserRole } from '../../shared/utils/user-role';
import { useAuth } from '../../auth/components/AuthProvider';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';

function formatUserName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

export function UserDetailDialog({
  userId,
  onClose,
  currentStatusFilter,
  onUserRemovedFromFilteredPage,
}: {
  userId: string;
  onClose: () => void;
  currentStatusFilter: UserStatus | 'all';
  onUserRemovedFromFilteredPage: () => void;
}) {
  const modalRef = useEscapeKey<HTMLDivElement>(onClose);
  const { user: authUser } = useAuth();
  const { data: user, error, isLoading } = useUser(userId);
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const restoreUser = useRestoreUser();

  const errorMessage =
    error instanceof Error ? error.message : 'No se pudo cargar el usuario';
  const updateMessage =
    updateUser.error instanceof Error ? updateUser.error.message : '';
  const deleteMessage =
    deleteUser.error instanceof Error ? deleteUser.error.message : '';
  const restoreMessage =
    restoreUser.error instanceof Error ? restoreUser.error.message : '';
  const feedbackMessage =
    updateMessage ||
    deleteMessage ||
    restoreMessage ||
    (updateUser.isSuccess
      ? 'Usuario actualizado'
      : deleteUser.isSuccess
        ? 'Usuario marcado como eliminado'
        : restoreUser.isSuccess
          ? 'Usuario restaurado'
          : '');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '');
    const surname = String(formData.get('surname') ?? '');
    const role = (formData.get('role') as UserRole | null) ?? 'client';

    await updateUser.mutateAsync({
      userId,
      input: { name, surname, role },
    });
  }

  async function handleDelete() {
    await deleteUser.mutateAsync(userId);

    if (currentStatusFilter === 'ACTIVE') {
      onUserRemovedFromFilteredPage();
    }
  }

  async function handleRestore() {
    await restoreUser.mutateAsync(userId);

    if (currentStatusFilter === 'DELETED') {
      onUserRemovedFromFilteredPage();
    }
  }

  const isMutating =
    updateUser.isPending || deleteUser.isPending || restoreUser.isPending;
  const isCurrentAuthenticatedUser = authUser?.id === userId;

  return (
    <div
      ref={modalRef}
      data-escape-modal="true"
      className="users-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-detail-title"
      onClick={onClose}
    >
      <section
        className="users-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="users-modal__header">
          <div>
            <p className="users-hero__eyebrow">User Detail</p>
            <h2 id="user-detail-title">Ver y editar user</h2>
          </div>

          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de user"
          >
            Cerrar
          </button>
        </header>

        {isLoading ? (
          <section className="users-panel">
            <p>Cargando usuario...</p>
          </section>
        ) : error || !user ? (
          <section className="users-panel">
            <p className="users-message users-message--error">{errorMessage}</p>
          </section>
        ) : (
          <section className="users-detail-grid">
            <article className="users-panel">
              <div className="user-card__header">
                <div>
                  <p className="user-card__label">Metadata</p>
                  <h3>{formatUserName(user.name, user.surname)}</h3>
                </div>

                <span
                  className={
                    user.status === 'ACTIVE'
                      ? 'user-badge user-badge--active'
                      : 'user-badge user-badge--deleted'
                  }
                >
                  {user.status}
                </span>
              </div>

              <dl className="user-card__meta">
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt>User ID</dt>
                  <dd>{user.id}</dd>
                </div>
                <div>
                  <dt>Rol</dt>
                  <dd>{formatUserRole(user.role)}</dd>
                </div>
                <div>
                  <dt>Created at</dt>
                  <dd>{new Date(user.created_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Deleted at</dt>
                  <dd>
                    {user.deleted_at
                      ? new Date(user.deleted_at).toLocaleString()
                      : 'No'}
                  </dd>
                </div>
              </dl>

              <div className="user-actions">
                <button
                  type="button"
                  className="user-actions__button user-actions__button--danger"
                  onClick={handleDelete}
                  disabled={
                    user.status === 'DELETED' ||
                    isMutating ||
                    isCurrentAuthenticatedUser
                  }
                >
                  {deleteUser.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>

                <button
                  type="button"
                  className="user-actions__button user-actions__button--secondary"
                  onClick={handleRestore}
                  disabled={user.status === 'ACTIVE' || isMutating}
                >
                  {restoreUser.isPending ? 'Restaurando...' : 'Restaurar'}
                </button>
              </div>
            </article>

            <article className="users-panel">
              <p className="user-card__label">Editar User</p>
              <h3>Patch admin</h3>

              <form
                key={`${user.id}:${user.name ?? ''}:${user.surname ?? ''}:${user.role}:${user.status}`}
                className="auth-form"
                onSubmit={handleSubmit}
              >
                <label className="auth-form__field">
                  <span>Nombre</span>
                  <input
                    name="name"
                    type="text"
                    defaultValue={user.name ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Apellido</span>
                  <input
                    name="surname"
                    type="text"
                    defaultValue={user.surname ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Rol</span>
                  <select name="role" defaultValue={user.role}>
                    <option value="client">Usuario</option>
                    <option value="technician">Técnico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={user.status === 'DELETED' || isMutating}
                >
                  {updateUser.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>

              <p
                className={
                  feedbackMessage
                    ? updateMessage || deleteMessage || restoreMessage
                      ? 'users-message users-message--error'
                      : 'users-message users-message--success'
                    : 'users-message'
                }
              >
                {feedbackMessage || ' '}
              </p>

              {isCurrentAuthenticatedUser ? (
                <p className="users-message">
                  No podés eliminar el usuario autenticado actual porque
                  perderías acceso admin.
                </p>
              ) : null}
            </article>
          </section>
        )}
      </section>
    </div>
  );
}
