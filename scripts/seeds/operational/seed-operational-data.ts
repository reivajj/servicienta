import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SeedContext, SeederResult } from '../../lib/types.js';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
}

interface ClientProfileSeedRow {
  id: string;
  phone: string;
  whatsapp_phone: string;
  default_address_text: string;
  default_lat: number;
  default_lng: number;
  address_notes: string;
  preferred_contact_channel: 'phone' | 'whatsapp';
}

interface OrderInsertRow {
  id: string;
  client_id: string;
  status: 'open' | 'in_progress' | 'en_garantia' | 'closed';
  flow_type: 'client_selects' | 'tech_applies';
  description: string;
  service_address_text: string;
  service_lat: number;
  service_lng: number;
  address_notes: string;
  created_at: string;
  updated_at: string;
}

interface OperationInsertRow {
  id: string;
  order_id: string;
  technician_id: string;
  status: 'confirmed' | 'completed';
  scheduled_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReviewInsertRow {
  technician_id: string;
  operation_id: string;
  client_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewValidationRow {
  operation_id: string;
  client_id: string;
}

interface OperationValidationRow {
  id: string;
  order:
    | {
        client_id: string;
      }
    | Array<{
        client_id: string;
      }>;
}

interface SeedOperationalDataOptions {
  clientEmails: string[];
  technicianEmails: string[];
}

const BASE_CLIENT_ADDRESSES = [
  {
    address: 'Honduras 4100, Palermo, CABA',
    lat: -34.59231,
    lng: -58.42482,
    notes: 'Timbre A, piso 2',
  },
  {
    address: 'Monroe 1900, Belgrano, CABA',
    lat: -34.55845,
    lng: -58.45192,
    notes: 'PH al fondo',
  },
  {
    address: 'Av. La Plata 700, Caballito, CABA',
    lat: -34.62089,
    lng: -58.43208,
    notes: 'Portero eléctrico 3B',
  },
  {
    address: 'Anchorena 1200, Recoleta, CABA',
    lat: -34.59062,
    lng: -58.39981,
    notes: 'Recepción 24h',
  },
  {
    address: 'Gurruchaga 900, Villa Crespo, CABA',
    lat: -34.59894,
    lng: -58.43776,
    notes: 'Casa con puerta gris',
  },
];

const ORDER_STATUS_SEQUENCE: Array<OrderInsertRow['status']> = [
  'open',
  'open',
  'open',
  'open',
  'in_progress',
  'in_progress',
  'in_progress',
  'in_progress',
  'en_garantia',
  'en_garantia',
  'en_garantia',
  'en_garantia',
  'closed',
  'closed',
  'closed',
  'closed',
];

const ORDER_DESCRIPTIONS = [
  'Heladera no enfría desde ayer',
  'Lavarropas pierde agua en centrifugado',
  'Microondas enciende pero no calienta',
  'Cocina con hornalla principal sin gas',
  'Aire acondicionado enfría poco',
  'Horno eléctrico corta a mitad de cocción',
  'Termotanque con temperatura inestable',
  'Calefón no prende con baja presión',
  'Secarropas hace ruido metálico',
  'Lavavajillas no completa el ciclo',
  'Heladera exhibe código de error',
  'Lavarropas no desagota',
  'Aire split gotea dentro del ambiente',
  'Microondas salta la térmica',
  'Cocina con chispero defectuoso',
  'Termotanque pierde agua por válvula',
];

async function loadUsersByRole(
  supabase: SupabaseClient,
  role: 'client' | 'technician',
  emails: string[],
) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, surname')
    .eq('role', role)
    .in('email', emails)
    .order('email', { ascending: true });

  if (error) throw new Error(`Could not load ${role} users: ${error.message}`);

  return (data ?? []) as UserRow[];
}

function buildClientProfiles(clients: UserRow[]): ClientProfileSeedRow[] {
  return clients.map((client, index) => {
    const address = BASE_CLIENT_ADDRESSES[index % BASE_CLIENT_ADDRESSES.length];
    const suffix = String(index + 1).padStart(2, '0');

    return {
      id: client.id,
      phone: `+54911000000${suffix}`,
      whatsapp_phone: `+54911000000${suffix}`,
      default_address_text: address.address,
      default_lat: address.lat,
      default_lng: address.lng,
      address_notes: address.notes,
      preferred_contact_channel: index % 2 === 0 ? 'whatsapp' : 'phone',
    };
  });
}

function buildOrders(clients: UserRow[]): OrderInsertRow[] {
  return ORDER_STATUS_SEQUENCE.map((status, index) => {
    const client = clients[index % clients.length];
    const address = BASE_CLIENT_ADDRESSES[index % BASE_CLIENT_ADDRESSES.length];
    const createdAt = new Date(
      Date.UTC(2026, 4, 1 + index, 9 + (index % 4), 0, 0),
    ).toISOString();
    const updatedAt = new Date(
      Date.UTC(2026, 4, 1 + index, 10 + (index % 4), 30, 0),
    ).toISOString();

    return {
      id: randomUUID(),
      client_id: client.id,
      status,
      flow_type: index % 3 === 0 ? 'tech_applies' : 'client_selects',
      description: ORDER_DESCRIPTIONS[index],
      service_address_text: address.address,
      service_lat: address.lat,
      service_lng: address.lng,
      address_notes: address.notes,
      created_at: createdAt,
      updated_at: updatedAt,
    };
  });
}

function buildOperations(
  orders: OrderInsertRow[],
  technicians: UserRow[],
): OperationInsertRow[] {
  const eligibleOrders = orders.filter((order) => order.status !== 'open');

  return eligibleOrders.map((order, index) => {
    const technician = technicians[index % technicians.length];
    const scheduledAt = new Date(
      Date.UTC(2026, 4, 2 + index, 14 + (index % 3), 0, 0),
    ).toISOString();
    const isCompleted =
      order.status === 'en_garantia' || order.status === 'closed';
    const completedAt = isCompleted
      ? new Date(
          Date.UTC(2026, 4, 2 + index, 16 + (index % 3), 15, 0),
        ).toISOString()
      : null;
    const updatedAt = completedAt ?? scheduledAt;

    return {
      id: randomUUID(),
      order_id: order.id,
      technician_id: technician.id,
      status: isCompleted ? 'completed' : 'confirmed',
      scheduled_at: scheduledAt,
      completed_at: completedAt,
      created_at: scheduledAt,
      updated_at: updatedAt,
    };
  });
}

function buildReviews(
  orders: OrderInsertRow[],
  operations: OperationInsertRow[],
): ReviewInsertRow[] {
  const operationsByOrderId = new Map(
    operations.map((operation) => [operation.order_id, operation]),
  );
  const reviewRatings = [5, 4, 5, 4];

  return orders
    .filter((order) => order.status === 'closed')
    .slice(0, 4)
    .map((order, index) => {
      const operation = operationsByOrderId.get(order.id);

      if (!operation?.completed_at) {
        throw new Error(`Missing completed operation for order ${order.id}`);
      }

      return {
        technician_id: operation.technician_id,
        operation_id: operation.id,
        client_id: order.client_id,
        rating: reviewRatings[index % reviewRatings.length],
        comment: `Review seeded para ${order.description.toLowerCase()}`,
        created_at: new Date(
          Date.parse(operation.completed_at) + 1000 * 60 * 60 * 24,
        ).toISOString(),
      };
    });
}

async function seedClientProfiles(
  context: SeedContext,
  clients: UserRow[],
): Promise<SeederResult> {
  const rows = buildClientProfiles(clients);
  const { error } = await context.supabase
    .from('client_profiles')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    throw new Error(`Could not seed client profiles: ${error.message}`);
  }

  return {
    entity: 'client-profiles',
    created: rows.length,
    updated: 0,
    deleted: 0,
    skipped: 0,
  };
}

async function seedOrders(
  context: SeedContext,
  orders: OrderInsertRow[],
): Promise<SeederResult> {
  const { error } = await context.supabase.from('orders').insert(orders);

  if (error) {
    throw new Error(`Could not seed orders: ${error.message}`);
  }

  return {
    entity: 'orders',
    created: orders.length,
    updated: 0,
    deleted: 0,
    skipped: 0,
  };
}

async function seedOperations(
  context: SeedContext,
  operations: OperationInsertRow[],
): Promise<SeederResult> {
  const { error } = await context.supabase
    .from('operations')
    .insert(operations);

  if (error) {
    throw new Error(`Could not seed operations: ${error.message}`);
  }

  return {
    entity: 'operations',
    created: operations.length,
    updated: 0,
    deleted: 0,
    skipped: 0,
  };
}

async function seedTechnicianReviews(
  context: SeedContext,
  reviews: ReviewInsertRow[],
): Promise<SeederResult> {
  const { error } = await context.supabase
    .from('technician_reviews')
    .insert(reviews);

  if (error) {
    throw new Error(`Could not seed technician reviews: ${error.message}`);
  }

  return {
    entity: 'technician-reviews',
    created: reviews.length,
    updated: 0,
    deleted: 0,
    skipped: 0,
  };
}

async function validateOperationalSeed(
  context: SeedContext,
  expectedClientCount: number,
  expectedOrderCount: number,
  expectedOperationCount: number,
  expectedReviewCount: number,
) {
  const [
    orphanOperationsByOrder,
    orphanOperationsByTechnician,
    clientProfilesCount,
  ] = await Promise.all([
    context.supabase
      .from('operations')
      .select('id, orders!inner(id)', { count: 'exact', head: true }),
    context.supabase
      .from('operations')
      .select('id, technician_profiles!inner(id)', {
        count: 'exact',
        head: true,
      }),
    context.supabase
      .from('client_profiles')
      .select('id', { count: 'exact', head: true }),
  ]);

  if (orphanOperationsByOrder.error) {
    throw new Error(
      `Could not validate operations by order: ${orphanOperationsByOrder.error.message}`,
    );
  }

  if (orphanOperationsByTechnician.error) {
    throw new Error(
      `Could not validate operations by technician: ${orphanOperationsByTechnician.error.message}`,
    );
  }

  if (clientProfilesCount.error) {
    throw new Error(
      `Could not validate client profiles count: ${clientProfilesCount.error.message}`,
    );
  }

  if ((clientProfilesCount.count ?? 0) < expectedClientCount) {
    throw new Error('Client profiles seeded count is lower than expected');
  }

  const [ordersCount, operationsCount] = await Promise.all([
    context.supabase
      .from('orders')
      .select('id', { count: 'exact', head: true }),
    context.supabase
      .from('operations')
      .select('id', { count: 'exact', head: true }),
  ]);

  if (ordersCount.error) {
    throw new Error(
      `Could not validate orders count: ${ordersCount.error.message}`,
    );
  }

  if (operationsCount.error) {
    throw new Error(
      `Could not validate operations count: ${operationsCount.error.message}`,
    );
  }

  if ((ordersCount.count ?? 0) !== expectedOrderCount) {
    throw new Error('Orders seeded count does not match expected dataset');
  }

  if ((operationsCount.count ?? 0) !== expectedOperationCount) {
    throw new Error('Operations seeded count does not match expected dataset');
  }

  if ((orphanOperationsByOrder.count ?? 0) !== expectedOperationCount) {
    throw new Error('Some operations do not resolve to an order');
  }

  if ((orphanOperationsByTechnician.count ?? 0) !== expectedOperationCount) {
    throw new Error('Some operations do not resolve to a technician profile');
  }

  await validateReviewOperationIntegrity(context, expectedReviewCount);
}

async function validateReviewOperationIntegrity(
  context: SeedContext,
  expectedReviewCount: number,
) {
  const { data: reviewRows, error: reviewRowsError } = await context.supabase
    .from('technician_reviews')
    .select('operation_id, client_id');

  if (reviewRowsError) {
    throw new Error(
      `Could not validate reviews by operation: ${reviewRowsError.message}`,
    );
  }

  const reviews = (reviewRows ?? []) as ReviewValidationRow[];

  if (reviews.length !== expectedReviewCount) {
    throw new Error(
      'Technician reviews seeded count does not match expected dataset',
    );
  }

  const operationIds = Array.from(
    new Set(reviews.map((review) => review.operation_id)),
  );
  const { data: operationRows, error: operationRowsError } =
    await context.supabase
      .from('operations')
      .select('id, order:orders!operations_order_id_fkey(client_id)')
      .in('id', operationIds);

  if (operationRowsError) {
    throw new Error(
      `Could not load operations for review validation: ${operationRowsError.message}`,
    );
  }

  const operationsById = new Map(
    ((operationRows ?? []) as OperationValidationRow[]).map((operation) => [
      operation.id,
      operation,
    ]),
  );

  if (operationsById.size !== operationIds.length) {
    throw new Error('Some technician reviews do not resolve to an operation');
  }

  for (const review of reviews) {
    const operation = operationsById.get(review.operation_id);

    if (!operation) {
      throw new Error('Some technician reviews do not resolve to an operation');
    }

    const order = Array.isArray(operation.order)
      ? operation.order[0]
      : operation.order;

    if (!order || order.client_id !== review.client_id) {
      throw new Error(
        'Some technician reviews do not match the operation client',
      );
    }
  }
}

export async function seedOperationalData(
  context: SeedContext,
  options: SeedOperationalDataOptions,
): Promise<SeederResult[]> {
  const [clients, technicians] = await Promise.all([
    loadUsersByRole(context.supabase, 'client', options.clientEmails),
    loadUsersByRole(context.supabase, 'technician', options.technicianEmails),
  ]);

  if (clients.length < 10) {
    throw new Error('Operational seed requires at least 10 client users');
  }

  if (technicians.length < 8) {
    throw new Error('Operational seed requires at least 8 technician users');
  }

  const targetClients = clients.slice(0, 10);
  const targetTechnicians = technicians.slice(0, 8);
  const orders = buildOrders(targetClients);
  const operations = buildOperations(orders, targetTechnicians);
  const reviews = buildReviews(orders, operations);

  const clientProfilesResult = await seedClientProfiles(context, targetClients);
  const ordersResult = await seedOrders(context, orders);
  const operationsResult = await seedOperations(context, operations);
  const reviewsResult = await seedTechnicianReviews(context, reviews);

  await validateOperationalSeed(
    context,
    targetClients.length,
    orders.length,
    operations.length,
    reviews.length,
  );

  context.logger.info('Operational seed completed', {
    seedTag: context.env.seedTag,
    clients: targetClients.length,
    technicians: targetTechnicians.length,
    orders: orders.length,
    operations: operations.length,
    reviews: reviews.length,
  });

  return [clientProfilesResult, ordersResult, operationsResult, reviewsResult];
}
