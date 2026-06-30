import { Link } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import {
  useAdminOperation,
  useCancelOperation,
  useCompleteTechOperation,
  useConfirmCompletedOperation,
  useCurrentOperation,
  useCurrentUser,
  useScheduleOperation,
  useUpdateAdminOperation,
} from '@servicienta/query-hooks';
import { OPERATION_SCHEDULE_STEP_MINUTES } from '@servicienta/types';
import type { Operation, OperationStatus } from '@servicienta/types';
import { ChatDialog } from '../../chat/components/ChatDialog';
import { DateTimePickerField } from '../../shared/components/DateTimePickerField';
import { InternalChatActionButton } from '../../shared/components/InternalChatActionButton';
import { ViewClientProfileActionLink } from '../../shared/components/ViewClientProfileActionLink';
import { ViewOrderActionLink } from '../../shared/components/ViewOrderActionLink';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';

function formatFullName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function toIsoDateTime(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return null;

  return new Date(rawValue).toISOString();
}

function getStatusBadgeClass(status: string) {
  return `status-badge status-badge--${status}`;
}

function formatOrderFlowType(value: Operation['order_flow_type']) {
  if (value === 'client_selects') return 'Client selects';
  if (value === 'tech_applies') return 'Tech applies';

  return 'Sin definir';
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sin definir';

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function buildAdminDateWarnings(operation: Operation) {
  const warnings: string[] = [];

  if (
    operation.scheduled_at &&
    operation.technician_completed_at &&
    new Date(operation.scheduled_at).getTime() >
      new Date(operation.technician_completed_at).getTime()
  ) {
    warnings.push(
      'La fecha programada actual es posterior a la completada por técnico.',
    );
  }

  if (
    operation.scheduled_at &&
    operation.completed_at &&
    new Date(operation.scheduled_at).getTime() >
      new Date(operation.completed_at).getTime()
  ) {
    warnings.push(
      'La fecha programada actual es posterior a la fecha completada.',
    );
  }

  if (
    operation.technician_completed_at &&
    operation.completed_at &&
    new Date(operation.technician_completed_at).getTime() >
      new Date(operation.completed_at).getTime()
  ) {
    warnings.push(
      'La fecha completada por técnico actual es posterior a la fecha completada.',
    );
  }

  if (operation.status === 'scheduled' && !operation.scheduled_at) {
    warnings.push(
      'El status actual es scheduled pero la operation no tiene fecha programada.',
    );
  }

  if (
    operation.status === 'completed_tech' &&
    !operation.technician_completed_at
  ) {
    warnings.push(
      'El status actual es completed_tech pero la operation no tiene fecha completada por técnico.',
    );
  }

  if (operation.status === 'completed' && !operation.completed_at) {
    warnings.push(
      'El status actual es completed pero la operation no tiene fecha completada.',
    );
  }

  return warnings;
}

function buildWhatsAppUrl(phone: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;

  return `https://wa.me/${digits}`;
}

function OperationUserCard({
  label,
  name,
  surname,
  email,
  phone,
  whatsappPhone,
  actionSlot,
}: {
  label: string;
  name: string | null;
  surname: string | null;
  email?: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  actionSlot?: ReactNode;
}) {
  const whatsAppUrl = buildWhatsAppUrl(whatsappPhone ?? phone);

  return (
    <article className="users-panel">
      <div className="user-card__header">
        <div>
          <p className="user-card__label">{label}</p>
          <h3>{formatFullName(name, surname)}</h3>
        </div>

        {actionSlot ? (
          <div className="orders-dialog__icon-actions">{actionSlot}</div>
        ) : null}
      </div>

      <dl className="user-card__meta">
        <div>
          <dt>Nombre</dt>
          <dd>{formatFullName(name, surname)}</dd>
        </div>
        {email !== undefined ? (
          <div>
            <dt>Email</dt>
            <dd>{email ?? 'Sin definir'}</dd>
          </div>
        ) : null}
        <div>
          <dt>Teléfono</dt>
          <dd className="orders-dialog__contact-row">
            <span>{phone ?? 'Sin definir'}</span>
            {whatsAppUrl ? (
              <a
                className="users-table__action users-table__action--icon"
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir WhatsApp"
                title="Abrir WhatsApp"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="users-table__action-icon"
                >
                  <path
                    d="M12.1 3.5a8.4 8.4 0 0 0-7.3 12.5L4 20.5l4.7-1.2a8.4 8.4 0 1 0 3.4-15.8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.2 8.8c.2-.4.4-.5.8-.5h.6c.2 0 .4 0 .5.4l.6 1.5c.1.3 0 .4-.1.6l-.4.5c-.1.1-.2.3-.1.5.2.5.7 1.2 1.4 1.8.9.8 1.7 1.1 2.1 1.3.2.1.4 0 .5-.1l.6-.7c.2-.2.4-.2.6-.1l1.4.7c.3.1.4.3.4.5v.5c0 .4-.2.7-.6.9-.4.2-1 .3-1.6.2-1-.2-2.2-.8-3.5-1.9-1-.8-1.8-1.8-2.3-2.8-.5-.9-.7-1.8-.6-2.5.1-.4.2-.7.3-.9Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            ) : null}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function CurrentOperationActions({ operation }: { operation: Operation }) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const scheduleOperation = useScheduleOperation();
  const completeTechOperation = useCompleteTechOperation();
  const confirmCompletedOperation = useConfirmCompletedOperation();
  const cancelOperation = useCancelOperation();

  const isTechnician = currentUser?.role === 'technician';
  const isClient = currentUser?.role === 'client';
  const feedbackMessage =
    scheduleOperation.error instanceof Error
      ? scheduleOperation.error.message
      : completeTechOperation.error instanceof Error
        ? completeTechOperation.error.message
        : confirmCompletedOperation.error instanceof Error
          ? confirmCompletedOperation.error.message
          : cancelOperation.error instanceof Error
            ? cancelOperation.error.message
            : scheduleOperation.isSuccess
              ? 'Operation agendada'
              : completeTechOperation.isSuccess
                ? 'Operation completada'
                : confirmCompletedOperation.isSuccess
                  ? 'Cierre confirmado'
                  : cancelOperation.isSuccess
                    ? 'Operation cancelada'
                    : '';
  const isMutating =
    scheduleOperation.isPending ||
    completeTechOperation.isPending ||
    confirmCompletedOperation.isPending ||
    cancelOperation.isPending;

  async function handleScheduleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await scheduleOperation.mutateAsync({
      operationId: operation.id,
      input: {
        scheduled_at: toIsoDateTime(formData.get('scheduled_at')) ?? '',
        description: String(formData.get('description') ?? ''),
      },
    });

    setShowScheduleForm(false);
  }

  const canTechnicianSchedule = isTechnician && operation.status === 'pending';
  const canTechnicianComplete =
    isTechnician && operation.status === 'scheduled';
  const canTechnicianCancel =
    isTechnician &&
    (operation.status === 'pending' || operation.status === 'scheduled');
  const canClientConfirm = isClient && operation.status === 'completed_tech';

  if (
    !canTechnicianSchedule &&
    !canTechnicianComplete &&
    !canTechnicianCancel &&
    !canClientConfirm
  ) {
    return null;
  }

  return (
    <article className="users-panel">
      <div className="user-card__header">
        <div>
          <p className="user-card__label">Acciones</p>
          <h3>Gestionar operation</h3>
        </div>
      </div>

      <div className="orders-dialog__actions">
        {canTechnicianSchedule ? (
          <button
            type="button"
            className="users-table__action"
            disabled={isMutating}
            onClick={() => setShowScheduleForm((current) => !current)}
          >
            Agendar
          </button>
        ) : null}

        {canTechnicianComplete ? (
          <button
            type="button"
            className="users-table__action users-table__action--success"
            disabled={isMutating}
            onClick={() => completeTechOperation.mutate(operation.id)}
          >
            Completar
          </button>
        ) : null}

        {canTechnicianCancel ? (
          <button
            type="button"
            className="users-table__action users-table__action--danger"
            disabled={isMutating}
            onClick={() => cancelOperation.mutate(operation.id)}
          >
            Cancelar
          </button>
        ) : null}

        {canClientConfirm ? (
          <button
            type="button"
            className="users-table__action"
            disabled={isMutating}
            onClick={() => confirmCompletedOperation.mutate(operation.id)}
          >
            Confirmar cierre
          </button>
        ) : null}
      </div>

      {canTechnicianSchedule && showScheduleForm ? (
        <form
          className="auth-form operation-detail__schedule-form"
          onSubmit={handleScheduleSubmit}
        >
          <DateTimePickerField
            name="scheduled_at"
            label="Fecha y horario"
            initialValue={operation.scheduled_at}
            required
            disablePastDates
            preventPastTimeSelection
            minuteStep={OPERATION_SCHEDULE_STEP_MINUTES}
          />

          <label className="auth-form__field">
            <span>Descripción técnica</span>
            <textarea
              name="description"
              defaultValue={operation.description ?? ''}
              required
            />
          </label>

          <div className="orders-dialog__actions">
            <button type="submit" disabled={scheduleOperation.isPending}>
              {scheduleOperation.isPending ? 'Guardando...' : 'Agendar'}
            </button>
          </div>
        </form>
      ) : null}

      <p
        className={
          feedbackMessage
            ? scheduleOperation.error ||
              completeTechOperation.error ||
              confirmCompletedOperation.error ||
              cancelOperation.error
              ? 'users-message users-message--error'
              : 'users-message users-message--success'
            : 'users-message'
        }
      >
        {feedbackMessage || ' '}
      </p>
    </article>
  );
}

function CurrentOperationDetailView({
  operationId,
  titleId,
  showCloseButton = false,
  onClose,
}: {
  operationId: string;
  titleId: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const {
    data: operation,
    error,
    isLoading,
  } = useCurrentOperation(operationId);
  const errorMessage =
    error instanceof Error ? error.message : 'No se pudo cargar la operation';
  const isTechnician = currentUser?.role === 'technician';

  return (
    <>
      <header
        className={showCloseButton ? 'users-modal__header' : 'users-hero'}
      >
        <div>
          <p className="users-hero__eyebrow">Operation Detail</p>
          <h2 id={titleId}>Detalle de operation</h2>
        </div>

        {showCloseButton && onClose ? (
          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de operation"
          >
            Cerrar
          </button>
        ) : null}
      </header>

      {isLoading ? (
        <section className="users-panel">
          <p>Cargando operation...</p>
        </section>
      ) : error || !operation ? (
        <section className="users-panel">
          <p className="users-message users-message--error">{errorMessage}</p>
        </section>
      ) : (
        <section className="users-detail-grid">
          {(() => {
            const adminDateWarnings = buildAdminDateWarnings(operation);

            return adminDateWarnings.length ? (
              <article className="users-panel operation-admin-warning-card">
                <p className="user-card__label">Warning</p>
                <h3>Inconsistencias temporales detectadas</h3>
                <ul className="operation-admin-warning-list">
                  {adminDateWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </article>
            ) : null;
          })()}

          <article className="users-panel">
            <div className="user-card__header">
              <div>
                <p className="user-card__label">Operation</p>
                <h3>{operation.id}</h3>
              </div>

              <span className={getStatusBadgeClass(operation.status)}>
                {operation.status}
              </span>
            </div>

            <dl className="user-card__meta">
              <div>
                <dt>Operation ID</dt>
                <dd>{operation.id}</dd>
              </div>
              <div>
                <dt>Order ID</dt>
                <dd>{operation.order_id}</dd>
              </div>
              <div>
                <dt>Programada</dt>
                <dd>{formatDateTime(operation.scheduled_at)}</dd>
              </div>
              <div>
                <dt>Terminada por técnico</dt>
                <dd>{formatDateTime(operation.technician_completed_at)}</dd>
              </div>
              <div>
                <dt>Completada</dt>
                <dd>{formatDateTime(operation.completed_at)}</dd>
              </div>
              <div>
                <dt>Descripción</dt>
                <dd>{operation.description ?? 'Sin definir'}</dd>
              </div>
            </dl>
          </article>

          <OperationUserCard
            label={isTechnician ? 'Cliente' : 'Técnico'}
            name={
              isTechnician ? operation.client_name : operation.technician_name
            }
            surname={
              isTechnician
                ? operation.client_surname
                : operation.technician_surname
            }
            phone={
              isTechnician ? operation.client_phone : operation.technician_phone
            }
            whatsappPhone={
              isTechnician
                ? operation.client_whatsapp_phone
                : operation.technician_whatsapp_phone
            }
            actionSlot={
              isTechnician ? (
                <>
                  <InternalChatActionButton
                    label="Abrir chat interno"
                    onClick={() => setIsChatOpen(true)}
                  />
                  <ViewClientProfileActionLink
                    clientProfileId={operation.client_id}
                    label="Ver cliente"
                    icon="person"
                  />
                </>
              ) : (
                <>
                  <InternalChatActionButton
                    label="Abrir chat interno"
                    onClick={() => setIsChatOpen(true)}
                  />
                  <Link
                    className="users-table__action users-table__action--icon"
                    to="/technicians/$technicianId"
                    params={{
                      technicianId:
                        operation.technician_public_slug ??
                        operation.technician_id,
                    }}
                    aria-label="Ver técnico"
                    title="Ver técnico"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="users-table__action-icon"
                    >
                      <path
                        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M4.5 20a7.5 7.5 0 0 1 15 0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Link>
                </>
              )
            }
          />

          <article className="users-panel">
            <div className="user-card__header">
              <div>
                <p className="user-card__label">Order asociada</p>
                <h3>Contexto de la solicitud</h3>
              </div>

              <div className="orders-dialog__icon-actions">
                {operation.order_status ? (
                  <span className={getStatusBadgeClass(operation.order_status)}>
                    {operation.order_status}
                  </span>
                ) : null}
                <ViewOrderActionLink
                  orderId={operation.order_id}
                  label="Ver order asociada"
                />
              </div>
            </div>

            <dl className="user-card__meta">
              <div>
                <dt>Flow type</dt>
                <dd>{formatOrderFlowType(operation.order_flow_type)}</dd>
              </div>
              <div>
                <dt>Dirección</dt>
                <dd>{operation.service_address_text ?? 'Sin definir'}</dd>
              </div>
              <div>
                <dt>Zona</dt>
                <dd>{operation.zone_slug ?? 'Sin definir'}</dd>
              </div>
              <div>
                <dt>Rubro</dt>
                <dd>{operation.appliance_type_slug ?? 'Sin definir'}</dd>
              </div>
              <div>
                <dt>Notas</dt>
                <dd>{operation.address_notes ?? 'Sin notas'}</dd>
              </div>
            </dl>
          </article>

          <CurrentOperationActions operation={operation} />
        </section>
      )}
      {isChatOpen && operation ? (
        <ChatDialog
          orderId={operation.order_id}
          operationId={operation.id}
          onClose={() => setIsChatOpen(false)}
        />
      ) : null}
    </>
  );
}

function AdminOperationDetailView({
  operationId,
  titleId,
  showCloseButton = false,
  onClose,
}: {
  operationId: string;
  titleId: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { data: operation, error, isLoading } = useAdminOperation(operationId);
  const updateOperation = useUpdateAdminOperation();
  const errorMessage =
    error instanceof Error ? error.message : 'No se pudo cargar la operation';
  const updateMessage =
    updateOperation.error instanceof Error ? updateOperation.error.message : '';
  const feedbackMessage =
    updateMessage || (updateOperation.isSuccess ? 'Operation actualizada' : '');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await updateOperation.mutateAsync({
      operationId,
      input: {
        status: (formData.get('status') as OperationStatus | null) ?? 'pending',
        scheduled_at: toIsoDateTime(formData.get('scheduled_at')),
        description: String(formData.get('description') ?? '') || null,
        technician_completed_at: toIsoDateTime(
          formData.get('technician_completed_at'),
        ),
        completed_at: toIsoDateTime(formData.get('completed_at')),
      },
    });
  }

  return (
    <>
      <header
        className={showCloseButton ? 'users-modal__header' : 'users-hero'}
      >
        <div>
          <p className="users-hero__eyebrow">Operation Detail</p>
          <h2 id={titleId}>Ver y editar operation</h2>
        </div>

        {showCloseButton && onClose ? (
          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de operation"
          >
            Cerrar
          </button>
        ) : null}
      </header>

      {isLoading ? (
        <section className="users-panel">
          <p>Cargando operation...</p>
        </section>
      ) : error || !operation ? (
        <section className="users-panel">
          <p className="users-message users-message--error">{errorMessage}</p>
        </section>
      ) : (
        <section className="users-detail-grid">
          <article className="users-panel">
            <div className="user-card__header">
              <div>
                <p className="user-card__label">Operation</p>
                <h3>
                  {formatFullName(
                    operation.technician_name,
                    operation.technician_surname,
                  )}
                </h3>
              </div>

              <span className={getStatusBadgeClass(operation.status)}>
                {operation.status}
              </span>
            </div>

            <dl className="user-card__meta">
              <div>
                <dt>Operation ID</dt>
                <dd>{operation.id}</dd>
              </div>
              <div>
                <dt>Order ID</dt>
                <dd>{operation.order_id}</dd>
              </div>
              <div>
                <dt>Cliente</dt>
                <dd>
                  {formatFullName(
                    operation.client_name,
                    operation.client_surname,
                  )}
                </dd>
              </div>
              <div>
                <dt>Técnico</dt>
                <dd>{operation.technician_email}</dd>
              </div>
              <div>
                <dt>Dirección</dt>
                <dd>{operation.service_address_text}</dd>
              </div>
            </dl>
          </article>

          <OperationUserCard
            label="Cliente"
            name={operation.client_name}
            surname={operation.client_surname}
            email={operation.client_email}
            phone={operation.client_phone}
            whatsappPhone={operation.client_whatsapp_phone}
            actionSlot={
              <>
                <InternalChatActionButton
                  label="Abrir chat interno"
                  onClick={() => setIsChatOpen(true)}
                />
                <ViewClientProfileActionLink
                  clientProfileId={operation.client_id}
                  label="Ver cliente"
                  icon="person"
                />
              </>
            }
          />

          <OperationUserCard
            label="Técnico"
            name={operation.technician_name}
            surname={operation.technician_surname}
            email={operation.technician_email}
            phone={operation.technician_phone}
            whatsappPhone={operation.technician_whatsapp_phone}
            actionSlot={
              <>
                <InternalChatActionButton
                  label="Abrir chat interno"
                  onClick={() => setIsChatOpen(true)}
                />
                <Link
                  className="users-table__action users-table__action--icon"
                  to="/technicians/$technicianId"
                  params={{ technicianId: operation.technician_id }}
                  aria-label="Ver técnico"
                  title="Ver técnico"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="users-table__action-icon"
                  >
                    <path
                      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M4.5 20a7.5 7.5 0 0 1 15 0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </Link>
              </>
            }
          />

          <article className="users-panel">
            <div className="user-card__header">
              <div>
                <p className="user-card__label">Order asociada</p>
                <h3>Contexto de la solicitud</h3>
              </div>

              <div className="orders-dialog__icon-actions">
                {operation.order_status ? (
                  <span className={getStatusBadgeClass(operation.order_status)}>
                    {operation.order_status}
                  </span>
                ) : null}
                <ViewOrderActionLink
                  orderId={operation.order_id}
                  label="Ver order asociada"
                />
              </div>
            </div>

            <dl className="user-card__meta">
              <div>
                <dt>Flow type</dt>
                <dd>{formatOrderFlowType(operation.order_flow_type)}</dd>
              </div>
              <div>
                <dt>Dirección</dt>
                <dd>{operation.service_address_text ?? 'Sin definir'}</dd>
              </div>
              <div>
                <dt>Zona</dt>
                <dd>{operation.zone_slug ?? 'Sin definir'}</dd>
              </div>
              <div>
                <dt>Rubro</dt>
                <dd>{operation.appliance_type_slug ?? 'Sin definir'}</dd>
              </div>
              <div>
                <dt>Notas</dt>
                <dd>{operation.address_notes ?? 'Sin notas'}</dd>
              </div>
            </dl>
          </article>

          <article className="users-panel operation-admin-edit-card">
            <p className="user-card__label">Editar Operation</p>
            <h3>Patch admin</h3>
            <p className="operation-admin-override-copy">
              Override administrativo. Acá se permite corregir fechas pasadas o
              futuras y limpiar valores, pero el backend valida consistencia
              minima entre programada, completada por técnico y completada.
            </p>

            <form
              key={`${operation.id}:${operation.status}:${operation.scheduled_at ?? ''}:${operation.completed_at ?? ''}`}
              className="auth-form operation-admin-edit-form"
              onSubmit={handleSubmit}
            >
              <label className="auth-form__field operation-admin-edit-form__status">
                <span>Status</span>
                <select name="status" defaultValue={operation.status}>
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed_tech">Completed tech</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="auth-form__field operation-admin-edit-form__description">
                <span>Descripción técnica</span>
                <input
                  name="description"
                  type="text"
                  defaultValue={operation.description ?? ''}
                />
              </label>

              <div className="operation-admin-edit-form__dates">
                <DateTimePickerField
                  name="scheduled_at"
                  label="Programada"
                  initialValue={operation.scheduled_at}
                  allowClear
                />

                <DateTimePickerField
                  name="technician_completed_at"
                  label="Completada por técnico"
                  initialValue={operation.technician_completed_at}
                  allowClear
                />

                <DateTimePickerField
                  name="completed_at"
                  label="Completada"
                  initialValue={operation.completed_at}
                  allowClear
                />
              </div>

              <button type="submit" disabled={updateOperation.isPending}>
                {updateOperation.isPending ? 'Guardando...' : 'Guardar cambios'}
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

          <article className="users-panel operation-detail-review">
            <div className="user-card__header">
              <div>
                <p className="user-card__label">TechnicianReview</p>
                <h3>Review del técnico</h3>
              </div>

              {operation.technician_review ? (
                <span className="operation-review__rating">
                  {operation.technician_review.rating}/5
                </span>
              ) : null}
            </div>

            {operation.technician_review ? (
              <dl className="user-card__meta">
                <div>
                  <dt>Rating</dt>
                  <dd>{operation.technician_review.rating}/5</dd>
                </div>
                <div>
                  <dt>Comment</dt>
                  <dd>
                    {operation.technician_review.comment || 'Sin comentario'}
                  </dd>
                </div>
                <div>
                  <dt>Created at</dt>
                  <dd>
                    {formatDateTime(operation.technician_review.created_at)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="users-message">
                Esta operation todavía no tiene TechnicianReview.
              </p>
            )}
          </article>
        </section>
      )}
      {isChatOpen && operation ? (
        <ChatDialog
          orderId={operation.order_id}
          operationId={operation.id}
          onClose={() => setIsChatOpen(false)}
        />
      ) : null}
    </>
  );
}

export function OperationDetailDialog({
  operationId,
  onClose,
  mode = 'admin',
}: {
  operationId: string;
  onClose: () => void;
  mode?: 'admin' | 'current';
}) {
  const modalRef = useEscapeKey<HTMLDivElement>(onClose);

  return (
    <div
      ref={modalRef}
      data-escape-modal="true"
      className="users-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="operation-detail-title"
      onClick={onClose}
    >
      <section
        className="users-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        {mode === 'current' ? (
          <CurrentOperationDetailView
            operationId={operationId}
            titleId="operation-detail-title"
            showCloseButton
            onClose={onClose}
          />
        ) : (
          <AdminOperationDetailView
            operationId={operationId}
            titleId="operation-detail-title"
            showCloseButton
            onClose={onClose}
          />
        )}
      </section>
    </div>
  );
}

export function OperationPage({ operationId }: { operationId: string }) {
  const { data: currentUser, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <main className="users-page">
        <section className="users-layout">
          <section className="users-panel">
            <p>Cargando usuario...</p>
          </section>
        </section>
      </main>
    );
  }

  if (error || !currentUser) {
    return (
      <main className="users-page">
        <section className="users-layout">
          <section className="users-panel">
            <p className="users-message users-message--error">
              No se pudo cargar el usuario actual.
            </p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="users-page">
      <section className="users-layout">
        {currentUser.role === 'admin' ? (
          <AdminOperationDetailView
            operationId={operationId}
            titleId="operation-page-title"
          />
        ) : (
          <CurrentOperationDetailView
            operationId={operationId}
            titleId="operation-page-title"
          />
        )}
      </section>
    </main>
  );
}
