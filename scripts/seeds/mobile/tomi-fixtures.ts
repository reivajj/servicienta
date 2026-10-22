import { createHash } from 'node:crypto';

export const MOBILE_SEED_TAG = 'mobile-tomi-oct-nov-2026';
export const MOBILE_SEED_MARKER = `[seed:${MOBILE_SEED_TAG}]`;
export const TECHNICIAN_EMAIL = 'tomi.tech@test.com';
export const CLIENT_EMAILS = [
  'juan-user@lopez.com.ar',
  'test-signup@test.com',
] as const;

export function fixtureId(entity: 'order' | 'operation', index: number) {
  const hex = createHash('sha256')
    .update(`${MOBILE_SEED_TAG}:${entity}:${index}`)
    .digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function buildTomiFixtures(
  technicianId: string,
  clientIds: string[],
  today: string,
) {
  if (clientIds.length !== 2 || new Set(clientIds).size !== 2)
    throw new Error('Se requieren dos clientes distintos');
  if (
    !/^2026-10-\d{2}$/.test(today) ||
    Number(today.slice(-2)) < 1 ||
    Number(today.slice(-2)) > 31
  )
    throw new Error('--today debe ser una fecha de octubre de 2026');
  const octoberDays = [1, 3, 5, 7, 9, 12, 15, 22, 26, 30];
  const novemberDays = [2, 7, 12, 19, 26];
  const equipment = [
    ['heladera', 'Heladera no enfría y hace ruido'],
    ['lavarropas', 'Lavarropas pierde agua al centrifugar'],
    ['microondas', 'Microondas enciende pero no calienta'],
    ['cocina', 'Cocina con encendido intermitente'],
  ];
  const addresses = [
    ['Honduras 4100, Palermo, CABA', 'palermo', -34.59231, -58.42482],
    ['Monroe 1900, Belgrano, CABA', 'belgrano', -34.55845, -58.45192],
    ['Av. La Plata 700, Caballito, CABA', 'caballito', -34.62089, -58.43208],
    ['Anchorena 1200, Recoleta, CABA', 'recoleta', -34.59062, -58.39981],
  ] as const;
  const orders = Array.from({ length: 40 }, (_, index) => {
    const scheduled = index < 15 || index >= 35;
    const day =
      index < 5
        ? today
        : index < 15
          ? `2026-10-${String(octoberDays[index - 5]).padStart(2, '0')}`
          : index >= 35
            ? `2026-11-${String(novemberDays[index - 35]).padStart(2, '0')}`
            : `2026-10-${String(1 + ((index - 15) % 20)).padStart(2, '0')}`;
    const [address, zone, lat, lng] = addresses[index % addresses.length];
    const [appliance, problem] = equipment[index % equipment.length];
    const created = new Date(`${day}T08:00:00-03:00`).toISOString();
    return {
      id: fixtureId('order', index),
      client_id: clientIds[index % 2],
      technician_id: technicianId,
      status: scheduled ? ('in_progress' as const) : ('pending' as const),
      flow_type: 'client_selects' as const,
      description: `${MOBILE_SEED_MARKER} #${String(index + 1).padStart(2, '0')} ${problem}`,
      service_address_text: address,
      service_lat: lat,
      service_lng: lng,
      address_notes: `${MOBILE_SEED_MARKER} Datos ficticios para probar mobile. Timbre ${index + 1}.`,
      zone_slug: zone,
      appliance_type_slug: appliance,
      created_at: created,
      updated_at: created,
    };
  });
  const operations = orders.flatMap((order, index) => {
    if (order.status === 'pending') return [];
    const localDay = new Date(
      new Date(order.created_at).getTime() - 3 * 3600_000,
    )
      .toISOString()
      .slice(0, 10);
    return [
      {
        id: fixtureId('operation', index),
        order_id: order.id,
        technician_id: technicianId,
        status: 'scheduled' as const,
        scheduled_at: new Date(
          `${localDay}T${String(9 + (index % 5) * 2).padStart(2, '0')}:00:00-03:00`,
        ).toISOString(),
        description: `${MOBILE_SEED_MARKER} Visita de prueba #${index + 1}`,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
    ];
  });
  return { orders, operations };
}
