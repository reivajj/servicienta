#!/usr/bin/env node
import { parseCliArgs, readStringFlag } from '../lib/cli.js';
import { readSeedEnv } from '../lib/env.js';
import { createSeedSupabaseClient } from '../lib/supabase-admin.js';
import {
  buildTomiFixtures,
  CLIENT_EMAILS,
  MOBILE_SEED_MARKER,
  MOBILE_SEED_TAG,
  TECHNICIAN_EMAIL,
} from '../seeds/mobile/tomi-fixtures.js';

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  for (const key of args.flags.keys()) {
    if (!['apply', 'cleanup', 'today'].includes(key))
      throw new Error(`Opción desconocida --${key}`);
  }
  const apply = args.flags.get('apply') === true;
  const cleanup = args.flags.get('cleanup') === true;
  const today = readStringFlag(args, 'today') ?? '2026-10-20';
  const env = readSeedEnv();
  const supabase = createSeedSupabaseClient(env);
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id,email,role,status,deleted_at')
    .in('email', [TECHNICIAN_EMAIL, ...CLIENT_EMAILS]);
  if (usersError) throw new Error(usersError.message);
  function userId(email: string, role: string) {
    const matches = (users ?? []).filter((user) => user.email === email);
    if (matches.length !== 1 || matches[0].role !== role)
      throw new Error(`No existe una única cuenta ${role}: ${email}`);
    if (!cleanup && (matches[0].status !== 'ACTIVE' || matches[0].deleted_at))
      throw new Error(`Cuenta inactiva: ${email}`);
    return matches[0].id as string;
  }
  const technicianId = userId(TECHNICIAN_EMAIL, 'technician');
  const clients = CLIENT_EMAILS.map((email) => userId(email, 'client'));
  const { orders, operations } = buildTomiFixtures(
    technicianId,
    clients,
    today,
  );
  const orderIds = orders.map((row) => row.id);
  const { data: existing, error: existingError } = await supabase
    .from('orders')
    .select('id,technician_id,client_id,address_notes')
    .in('id', orderIds);
  if (existingError) throw new Error(existingError.message);
  for (const row of existing ?? []) {
    if (
      row.technician_id !== technicianId ||
      !clients.includes(row.client_id) ||
      !row.address_notes?.startsWith(MOBILE_SEED_MARKER)
    ) {
      throw new Error(
        `Registro sin marca/propietario esperado: ${row.id}. No se modifica.`,
      );
    }
  }
  console.log(
    JSON.stringify(
      {
        mode: cleanup ? 'cleanup' : 'seed',
        apply,
        tag: MOBILE_SEED_TAG,
        technician: TECHNICIAN_EMAIL,
        clients: CLIENT_EMAILS,
        today,
        plannedOrders: 40,
        plannedOperations: 20,
        existingOrders: existing?.length ?? 0,
        ordersPerClient: 20,
        operationsPerClient: 10,
        octoberOperations: 15,
        novemberOperations: 5,
      },
      null,
      2,
    ),
  );
  if (!apply) {
    console.log('Simulación: agregar --apply para ejecutar.');
    return;
  }
  if (cleanup) {
    const ids = (existing ?? []).map((row) => row.id);
    if (ids.length) {
      const { data: removed, error } = await supabase
        .from('orders')
        .delete()
        .in('id', ids)
        .eq('technician_id', technicianId)
        .like('address_notes', `${MOBILE_SEED_MARKER}%`)
        .select('id');
      if (error) throw new Error(error.message);
      console.log(
        `Eliminados ${removed.length} pedidos del escenario y sus dependencias por cascade.`,
      );
    } else console.log('Sin pedidos del escenario para eliminar.');
    return;
  }
  // Validate all foreign keys before the first write. Never change existing accounts or catalogs.
  for (const [table, column, values] of [
    ['technician_profiles', 'id', [technicianId]],
    ['client_profiles', 'id', clients],
    ['zones', 'slug', [...new Set(orders.map((row) => row.zone_slug))]],
    [
      'appliance_types',
      'slug',
      [...new Set(orders.map((row) => row.appliance_type_slug))],
    ],
  ] as const) {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .in(column, [...values]);
    if (error) throw new Error(error.message);
    if (data.length !== values.length)
      throw new Error(`Faltan relaciones en ${table}; no se insertaron datos.`);
  }
  // Ignore duplicates so rerunning never resets manual tests or reprogrammed visits.
  const { error: orderError } = await supabase
    .from('orders')
    .upsert(orders, { onConflict: 'id', ignoreDuplicates: true });
  if (orderError) throw new Error(orderError.message);
  const { data: storedOperations, error: readOperationsError } = await supabase
    .from('operations')
    .select('id,order_id,technician_id')
    .in('order_id', orderIds);
  if (readOperationsError) throw new Error(readOperationsError.message);
  const newOperations = operations.filter(
    (row) =>
      !(storedOperations ?? []).some(
        (stored) => stored.order_id === row.order_id,
      ),
  );
  if (newOperations.length) {
    const { error: operationError } = await supabase
      .from('operations')
      .upsert(newOperations, { onConflict: 'id', ignoreDuplicates: true });
    if (operationError)
      throw new Error(
        `${operationError.message}. Los pedidos quedaron marcados; se puede reintentar o limpiar.`,
      );
  }
  const { data: verifiedOrders, error: verifyOrderError } = await supabase
    .from('orders')
    .select('id,client_id,created_at,status')
    .in('id', orderIds);
  const { data: verifiedOperations, error: verifyOperationError } =
    await supabase
      .from('operations')
      .select('id,order_id,status,scheduled_at')
      .in('order_id', orderIds);
  if (verifyOrderError || verifyOperationError)
    throw new Error(verifyOrderError?.message ?? verifyOperationError?.message);
  const localDay = (date: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  console.log(
    JSON.stringify(
      {
        verifiedOrders: verifiedOrders.length,
        verifiedOperations: verifiedOperations.length,
        clients: CLIENT_EMAILS.map((email, i) => ({
          email,
          orders: verifiedOrders.filter((row) => row.client_id === clients[i])
            .length,
          operations: verifiedOperations.filter((op) =>
            verifiedOrders.some(
              (order) =>
                order.id === op.order_id && order.client_id === clients[i],
            ),
          ).length,
        })),
        scheduledToday: verifiedOperations.filter(
          (row) =>
            row.status === 'scheduled' &&
            row.scheduled_at &&
            localDay(row.scheduled_at) === today,
        ).length,
        novemberOperations: verifiedOperations.filter(
          (row) =>
            row.scheduled_at &&
            localDay(row.scheduled_at).startsWith('2026-11'),
        ).length,
        novemberOrders: verifiedOrders.filter((row) =>
          localDay(row.created_at).startsWith('2026-11'),
        ).length,
      },
      null,
      2,
    ),
  );
  if (verifiedOrders.length !== 40 || verifiedOperations.length !== 20)
    throw new Error('Los totales no coinciden con el escenario esperado.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Error inesperado');
  process.exitCode = 1;
});
