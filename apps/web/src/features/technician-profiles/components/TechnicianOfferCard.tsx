import { useState, type FormEvent } from 'react';
import {
  useCurrentTechnicianOffer,
  useUpdateCurrentTechnicianOffer,
} from '@servicienta/query-hooks';
import type { TechnicianOffer, TechnicianOfferDetails } from '@servicienta/types';

export function TechnicianOfferCard() {
  const { data, error, isLoading } = useCurrentTechnicianOffer();

  if (isLoading) return <section className="users-panel">Cargando oferta...</section>;
  if (error || !data) return <section className="users-panel users-message--error">{error instanceof Error ? error.message : 'No se pudo cargar la oferta'}</section>;
  return <TechnicianOfferEditor data={data} />;
}

function TechnicianOfferEditor({ data }: { data: TechnicianOfferDetails }) {
  const update = useUpdateCurrentTechnicianOffer();
  const [offer, setOffer] = useState<TechnicianOffer>(data.offer);
  const [message, setMessage] = useState('');

  function toggleZone(zoneId: string) {
    setOffer((current) => current && ({
      ...current,
      zoneIds: current.zoneIds.includes(zoneId)
        ? current.zoneIds.filter((id) => id !== zoneId)
        : [...current.zoneIds, zoneId],
    }));
  }

  function toggleAppliance(applianceTypeId: string) {
    setOffer((current) => current && ({
      ...current,
      specialties: current.specialties.some((item) => item.applianceTypeId === applianceTypeId)
        ? current.specialties.filter((item) => item.applianceTypeId !== applianceTypeId)
        : [...current.specialties, { applianceTypeId, supportsAllBrands: true, brandIds: [] }],
    }));
  }

  function updateSpecialty(applianceTypeId: string, patch: Partial<TechnicianOffer['specialties'][number]>) {
    setOffer((current) => current && ({
      ...current,
      specialties: current.specialties.map((item) => item.applianceTypeId === applianceTypeId
        ? { ...item, ...patch }
        : item),
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offer) return;
    setMessage('');
    try {
      const response = await update.mutateAsync(offer);
      setOffer(response.data.offer);
      setMessage('Oferta guardada. Ya se refleja en la búsqueda.');
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'No se pudo guardar la oferta.');
    }
  }

  const ready = offer.zoneIds.length > 0 && offer.specialties.length > 0 && offer.available;

  return <section className="users-panel technician-offer-card">
    <div className="user-card__header">
      <div><p className="user-card__label">Oferta de servicio</p><h2>Zonas y especialidades</h2></div>
      <span className={ready ? 'user-badge user-badge--active' : 'user-badge user-badge--deleted'}>
        {ready ? 'Visible en búsqueda' : 'No visible en búsqueda'}
      </span>
    </div>
    <p>Elegí dónde trabajás y qué electrodomésticos atendés. Podés cambiarlo cuando quieras.</p>
    <form onSubmit={handleSave} className="technician-offer-form">
      <label className="technician-offer-switch">
        <input type="checkbox" checked={offer.available} onChange={(event) => setOffer({ ...offer, available: event.target.checked })} />
        Disponible para recibir pedidos
      </label>
      <fieldset>
        <legend>Zonas de cobertura</legend>
        <div className="technician-offer-options">{data.catalogs.zones.map((zone) =>
          <label key={zone.id}><input type="checkbox" checked={offer.zoneIds.includes(zone.id)} onChange={() => toggleZone(zone.id)} />{zone.name}</label>
        )}</div>
      </fieldset>
      <fieldset>
        <legend>Electrodomésticos y marcas</legend>
        <div className="technician-offer-specialties">{data.catalogs.applianceTypes.map((appliance) => {
          const specialty = offer.specialties.find((item) => item.applianceTypeId === appliance.id);
          return <div key={appliance.id} className="technician-offer-specialty">
            <label><input type="checkbox" checked={Boolean(specialty)} onChange={() => toggleAppliance(appliance.id)} />{appliance.name}</label>
            {specialty ? <div className="technician-offer-brand-options">
              <label><input type="checkbox" checked={specialty.supportsAllBrands} onChange={(event) => updateSpecialty(appliance.id, { supportsAllBrands: event.target.checked, brandIds: event.target.checked ? [] : specialty.brandIds })} />Todas las marcas</label>
              {!specialty.supportsAllBrands ? <div className="technician-offer-options">{data.catalogs.brands.map((brand) =>
                <label key={brand.id}><input type="checkbox" checked={specialty.brandIds.includes(brand.id)} onChange={() => updateSpecialty(appliance.id, { brandIds: specialty.brandIds.includes(brand.id) ? specialty.brandIds.filter((id) => id !== brand.id) : [...specialty.brandIds, brand.id] })} />{brand.name}</label>
              )}</div> : null}
            </div> : null}
          </div>;
        })}</div>
      </fieldset>
      {message ? <p className={update.isError ? 'users-message users-message--error' : 'users-message'} role="status">{message}</p> : null}
      <button type="submit" className="users-table__action" disabled={update.isPending}>{update.isPending ? 'Guardando...' : 'Guardar oferta'}</button>
    </form>
  </section>;
}
