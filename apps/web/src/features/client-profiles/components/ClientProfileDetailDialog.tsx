import { useClientProfile, useUpdateClientProfile } from '@servicienta/query-hooks';
import type { ClientPreferredContactChannel } from '@servicienta/types';

function formatClientName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function normalizeNullableFormValue(
  value: FormDataEntryValue | null,
): string | null {
  const normalized = String(value ?? '').trim();

  return normalized ? normalized : null;
}

export function ClientProfileDetailDialog({
  clientProfileId,
  onClose,
}: {
  clientProfileId: string;
  onClose: () => void;
}) {
  const { data: clientProfile, error, isLoading } =
    useClientProfile(clientProfileId);
  const updateClientProfile = useUpdateClientProfile();

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudo cargar el perfil del cliente';
  const updateMessage =
    updateClientProfile.error instanceof Error
      ? updateClientProfile.error.message
      : '';
  const feedbackMessage =
    updateMessage ||
    (updateClientProfile.isSuccess ? 'Perfil de cliente actualizado' : '');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const preferredContactChannel =
      (formData.get(
        'preferred_contact_channel',
      ) as ClientPreferredContactChannel | null) ?? 'phone';

    await updateClientProfile.mutateAsync({
      clientProfileId,
      input: {
        phone: normalizeNullableFormValue(formData.get('phone')),
        whatsapp_phone: normalizeNullableFormValue(
          formData.get('whatsapp_phone'),
        ),
        default_address_text: normalizeNullableFormValue(
          formData.get('default_address_text'),
        ),
        address_notes: normalizeNullableFormValue(formData.get('address_notes')),
        preferred_contact_channel: preferredContactChannel,
      },
    });
  }

  const isMutating = updateClientProfile.isPending;

  return (
    <div
      className="users-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-profile-detail-title"
      onClick={onClose}
    >
      <section
        className="users-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="users-modal__header">
          <div>
            <p className="users-hero__eyebrow">Client Profile</p>
            <h2 id="client-profile-detail-title">Ver y editar cliente</h2>
          </div>

          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de client profile"
          >
            Cerrar
          </button>
        </header>

        {isLoading ? (
          <section className="users-panel">
            <p>Cargando cliente...</p>
          </section>
        ) : error || !clientProfile ? (
          <section className="users-panel">
            <p className="users-message users-message--error">{errorMessage}</p>
          </section>
        ) : (
          <section className="users-detail-grid">
            <article className="users-panel">
              <div className="user-card__header">
                <div>
                  <p className="user-card__label">Identidad</p>
                  <h3>
                    {formatClientName(clientProfile.name, clientProfile.surname)}
                  </h3>
                </div>

                <span
                  className={
                    clientProfile.status === 'ACTIVE'
                      ? 'user-badge user-badge--active'
                      : 'user-badge user-badge--deleted'
                  }
                >
                  {clientProfile.status}
                </span>
              </div>

              <dl className="user-card__meta">
                <div>
                  <dt>Email</dt>
                  <dd>{clientProfile.email}</dd>
                </div>
                <div>
                  <dt>Client ID</dt>
                  <dd>{clientProfile.id}</dd>
                </div>
                <div>
                  <dt>Telefono</dt>
                  <dd>{clientProfile.phone ?? 'No cargado'}</dd>
                </div>
                <div>
                  <dt>Whatsapp</dt>
                  <dd>{clientProfile.whatsapp_phone ?? 'No cargado'}</dd>
                </div>
                <div>
                  <dt>Canal preferido</dt>
                  <dd>{clientProfile.preferred_contact_channel}</dd>
                </div>
                <div>
                  <dt>Direccion base</dt>
                  <dd>{clientProfile.default_address_text ?? 'No cargada'}</dd>
                </div>
                <div>
                  <dt>Notas</dt>
                  <dd>{clientProfile.address_notes ?? 'Sin notas'}</dd>
                </div>
                <div>
                  <dt>User created at</dt>
                  <dd>{new Date(clientProfile.user_created_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Profile updated at</dt>
                  <dd>{new Date(clientProfile.updated_at).toLocaleString()}</dd>
                </div>
              </dl>
            </article>

            <article className="users-panel">
              <p className="user-card__label">Editar perfil</p>
              <h3>Patch admin</h3>

              <form
                key={`${clientProfile.id}:${clientProfile.updated_at}`}
                className="auth-form"
                onSubmit={handleSubmit}
              >
                <label className="auth-form__field">
                  <span>Telefono</span>
                  <input
                    name="phone"
                    type="text"
                    defaultValue={clientProfile.phone ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Whatsapp</span>
                  <input
                    name="whatsapp_phone"
                    type="text"
                    defaultValue={clientProfile.whatsapp_phone ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Direccion base</span>
                  <input
                    name="default_address_text"
                    type="text"
                    defaultValue={clientProfile.default_address_text ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Notas de direccion</span>
                  <input
                    name="address_notes"
                    type="text"
                    defaultValue={clientProfile.address_notes ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Canal preferido</span>
                  <select
                    name="preferred_contact_channel"
                    defaultValue={clientProfile.preferred_contact_channel}
                  >
                    <option value="phone">Telefono</option>
                    <option value="whatsapp">Whatsapp</option>
                  </select>
                </label>

                <button type="submit" disabled={isMutating}>
                  {updateClientProfile.isPending
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </button>
              </form>

              <p
                className={
                  feedbackMessage
                    ? updateMessage
                      ? 'users-message users-message--error'
                      : 'users-message users-message--success'
                    : 'users-message'
                }
              >
                {feedbackMessage || ' '}
              </p>
            </article>
          </section>
        )}
      </section>
    </div>
  );
}
