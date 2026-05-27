import { useEffect, useState, type FormEvent } from 'react';
import type {
  AdminTechnicianProfile,
  TechnicianPreferredContactChannel,
  UpdateTechnicianProfileInput,
} from '@servicienta/types';

interface TechnicianProfileEditCardProps {
  profile: AdminTechnicianProfile;
  isSaving: boolean;
  onSave: (input: UpdateTechnicianProfileInput) => Promise<void>;
}

interface TechnicianProfileFormState {
  name: string;
  surname: string;
  bio: string;
  phone: string;
  whatsapp_phone: string;
  preferred_contact_channel: TechnicianPreferredContactChannel;
  base_address_text: string;
  base_lat: string;
  base_lng: string;
  service_radius_km: string;
}

function buildFormState(
  profile: AdminTechnicianProfile,
): TechnicianProfileFormState {
  return {
    name: profile.name ?? '',
    surname: profile.surname ?? '',
    bio: profile.bio ?? '',
    phone: profile.phone ?? '',
    whatsapp_phone: profile.whatsapp_phone ?? '',
    preferred_contact_channel: profile.preferred_contact_channel,
    base_address_text: profile.base_address_text ?? '',
    base_lat: profile.base_lat === null ? '' : String(profile.base_lat),
    base_lng: profile.base_lng === null ? '' : String(profile.base_lng),
    service_radius_km:
      profile.service_radius_km === null
        ? ''
        : String(profile.service_radius_km),
  };
}

function parseNullableNumber(value: string) {
  const normalized = value.trim();

  return normalized ? Number(normalized) : null;
}

function buildUpdateInput(
  formState: TechnicianProfileFormState,
): UpdateTechnicianProfileInput {
  return {
    name: formState.name,
    surname: formState.surname,
    bio: formState.bio,
    phone: formState.phone,
    whatsapp_phone: formState.whatsapp_phone,
    preferred_contact_channel: formState.preferred_contact_channel,
    base_address_text: formState.base_address_text,
    base_lat: parseNullableNumber(formState.base_lat),
    base_lng: parseNullableNumber(formState.base_lng),
    service_radius_km: parseNullableNumber(formState.service_radius_km),
  };
}

export function TechnicianProfileEditCard({
  profile,
  isSaving,
  onSave,
}: TechnicianProfileEditCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<TechnicianProfileFormState>(() =>
    buildFormState(profile),
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) return;

    setFormState(buildFormState(profile));
  }, [isEditing, profile]);

  function updateFormField<K extends keyof TechnicianProfileFormState>(
    key: K,
    value: TechnicianProfileFormState[K],
  ) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleEditStart() {
    setFormState(buildFormState(profile));
    setFormError(null);
    setIsEditing(true);
  }

  function handleEditCancel() {
    setFormState(buildFormState(profile));
    setFormError(null);
    setIsEditing(false);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = buildUpdateInput(formState);

    if (!input.name.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    if (
      (formState.base_lat.trim() && !Number.isFinite(input.base_lat)) ||
      (formState.base_lng.trim() && !Number.isFinite(input.base_lng)) ||
      (formState.service_radius_km.trim() &&
        !Number.isFinite(input.service_radius_km))
    ) {
      setFormError('Coordenadas y radio deben ser números válidos.');
      return;
    }

    try {
      setFormError(null);
      await onSave(input);
      setIsEditing(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el perfil.',
      );
    }
  }

  return (
    <section className="users-panel technician-profile-edit-card">
      <div className="user-card__header">
        <div>
          <p className="user-card__label">Edición</p>
          <h2>Perfil del técnico</h2>
        </div>
        {isEditing ? null : (
          <button
            type="button"
            className="users-table__action"
            onClick={handleEditStart}
          >
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <form className="technician-profile-form" onSubmit={handleEditSubmit}>
          <label className="users-toolbar__field">
            <span>Nombre</span>
            <input
              value={formState.name}
              onChange={(event) => updateFormField('name', event.target.value)}
            />
          </label>
          <label className="users-toolbar__field">
            <span>Apellido</span>
            <input
              value={formState.surname}
              onChange={(event) =>
                updateFormField('surname', event.target.value)
              }
            />
          </label>
          <label className="users-toolbar__field technician-profile-form__wide">
            <span>Bio</span>
            <textarea
              value={formState.bio}
              onChange={(event) => updateFormField('bio', event.target.value)}
            />
          </label>
          <label className="users-toolbar__field">
            <span>Teléfono</span>
            <input
              value={formState.phone}
              onChange={(event) => updateFormField('phone', event.target.value)}
            />
          </label>
          <label className="users-toolbar__field">
            <span>WhatsApp</span>
            <input
              value={formState.whatsapp_phone}
              onChange={(event) =>
                updateFormField('whatsapp_phone', event.target.value)
              }
            />
          </label>
          <label className="users-toolbar__field">
            <span>Canal preferido</span>
            <select
              value={formState.preferred_contact_channel}
              onChange={(event) =>
                updateFormField(
                  'preferred_contact_channel',
                  event.target.value as TechnicianPreferredContactChannel,
                )
              }
            >
              <option value="phone">Teléfono</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          <label className="users-toolbar__field technician-profile-form__wide">
            <span>Dirección base</span>
            <input
              value={formState.base_address_text}
              onChange={(event) =>
                updateFormField('base_address_text', event.target.value)
              }
            />
          </label>
          <label className="users-toolbar__field">
            <span>Latitud base</span>
            <input
              inputMode="decimal"
              value={formState.base_lat}
              onChange={(event) =>
                updateFormField('base_lat', event.target.value)
              }
            />
          </label>
          <label className="users-toolbar__field">
            <span>Longitud base</span>
            <input
              inputMode="decimal"
              value={formState.base_lng}
              onChange={(event) =>
                updateFormField('base_lng', event.target.value)
              }
            />
          </label>
          <label className="users-toolbar__field">
            <span>Radio operativo km</span>
            <input
              inputMode="decimal"
              value={formState.service_radius_km}
              onChange={(event) =>
                updateFormField('service_radius_km', event.target.value)
              }
            />
          </label>

          {formError ? (
            <p className="users-message users-message--error technician-profile-form__wide">
              {formError}
            </p>
          ) : null}

          <div className="technician-profile-form__actions">
            <button
              type="button"
              className="users-table__action"
              onClick={handleEditCancel}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="users-table__action"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
