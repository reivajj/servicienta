// Run against disposable PostgreSQL via PGlite, never against a linked database:
// PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node --import tsx scripts/tests/reject-completion-sql.test.mts
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';

const modulePath = process.env.PGLITE_MODULE ?? '@electric-sql/pglite';
const { PGlite } = await import(modulePath);
const db = new PGlite();
const client = '00000000-0000-4000-8000-000000000001';
const tech = '00000000-0000-4000-8000-000000000002';
const stranger = '00000000-0000-4000-8000-000000000003';
const order = '00000000-0000-4000-8000-000000000004';
const visit = '00000000-0000-4000-8000-000000000005';
const reason = 'Quedó una pérdida de agua.\nNecesito que la revisen.';
async function reject(actor = client, explanation = reason) {
  return db.query('select public.reject_operation_completion($1, $2, $3)', [
    visit,
    actor,
    explanation,
  ]);
}
async function snapshot() {
  const { rows } =
    await db.query(`select status, completion_rejection_reason as reason,
    completion_rejected_at as rejected_at, (select status from public.orders where id = '${order}') as order_status,
    (select count(*)::int from public.chat_messages) as messages,
    (select count(*)::int from public.chat_conversations) as conversations,
    (select count(*)::int from public.chat_conversation_participants) as participants,
    (select count(*)::int from public.activity_events) as events
    from public.operations where id = '${visit}'`);
  return rows[0];
}
async function reset() {
  await db.exec(`truncate public.chat_conversations, public.activity_events cascade;
    update public.operations set status = 'completed_tech', completion_rejection_reason = null, completion_rejected_at = null;
    update public.orders set status = 'completed_tech';`);
}
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table public.users (id uuid primary key, role text not null);
    create table public.orders (id uuid primary key, client_id uuid references public.users, status text, updated_at timestamptz);
    create table public.operations (id uuid primary key, order_id uuid references public.orders, technician_id uuid references public.users, status text, updated_at timestamptz);
    create table public.activity_events (id uuid primary key default gen_random_uuid(), actor_id uuid references public.users, entity_type text, entity_id uuid, event_type text, payload jsonb, created_at timestamptz);
    create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
    insert into public.users values ('${client}', 'client'), ('${tech}', 'technician'), ('${stranger}', 'client');
    insert into public.orders values ('${order}', '${client}', 'completed_tech', now());
    insert into public.operations values ('${visit}', '${order}', '${tech}', 'completed_tech', now());`);
  // Exercise the real chat schema and timestamp triggers, without Supabase-specific RLS auth helpers.
  const chat = await readFile(
    new URL(
      '../../supabase/migrations/202606300001_create_chat_conversations.sql',
      import.meta.url,
    ),
    'utf8',
  );
  await db.exec(
    chat.split(
      'alter table public.chat_conversations enable row level security;',
    )[0],
  );
  await db.exec(
    await readFile(
      new URL(
        '../../supabase/migrations/202610260001_reject_visit_completion_with_reason.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
});
after(async () => {
  await db.close();
});

test('confirmed rejection atomically saves reason, statuses, authored chat event and audit; retry is idempotent', async () => {
  await reset();
  await reject(client, ` \n${reason}\t `);
  const result = await snapshot();
  assert.equal(result.status, 'completion_rejected');
  assert.equal(result.order_status, 'completion_rejected');
  assert.equal(result.reason, reason);
  assert.ok(result.rejected_at);
  assert.equal(result.messages, 1);
  assert.equal(result.events, 1);
  assert.equal(result.participants, 2);
  const {
    rows: [message],
  } = await db.query('select * from public.chat_messages');
  assert.equal(message.sender_id, client);
  assert.equal(message.action_type, 'operation.reject_completed');
  assert.equal(message.message_type, 'action');
  assert.equal(
    message.body,
    `Rechacé la finalización de la visita.\nMotivo: ${reason}`,
  );
  assert.deepEqual(message.action_payload, { reason });
  assert.equal(message.related_operation_id, visit);
  assert.equal(message.related_order_id, order);
  const {
    rows: [event],
  } = await db.query('select * from public.activity_events');
  assert.equal(event.actor_id, client);
  assert.equal(event.payload.chat_message_id, message.id);
  assert.equal(event.payload.reason, reason);
  await reject();
  assert.deepEqual(await snapshot(), result);
  await assert.rejects(reject(client, 'Un motivo distinto'), { code: '22023' });
});

test('validates reason, ownership, role and status before producing side effects', async () => {
  await reset();
  const original = await snapshot();
  for (const invalid of ['', ' \n\t ', 'a'.repeat(2001)]) {
    await assert.rejects(reject(client, invalid), { code: '22023' });
  }
  await assert.rejects(reject(tech), { code: '42501' });
  await assert.rejects(reject(stranger), { code: 'P0002' });
  assert.deepEqual(await snapshot(), original);
  for (const status of ['pending', 'scheduled', 'completed', 'cancelled']) {
    await db.query('update public.operations set status = $1', [status]);
    await assert.rejects(reject(), { code: '22023' });
    assert.equal((await snapshot()).messages, 0);
  }
});

for (const table of ['chat_messages', 'activity_events']) {
  test(`failure inserting ${table} rolls back reason, states, message, participants and conversation`, async () => {
    await reset();
    const original = await snapshot();
    await db.exec(`create or replace function public.simulate_failure() returns trigger language plpgsql as $$ begin raise exception 'Simulated failure'; end; $$;
      create trigger simulate_failure before insert on public.${table} for each row execute function public.simulate_failure();`);
    try {
      await assert.rejects(reject(), /Simulated failure/);
      assert.deepEqual(await snapshot(), original);
    } finally {
      await db.exec(`drop trigger simulate_failure on public.${table}`);
    }
  });
}

test('uses an existing order chat without duplicating it or removing existing messages', async () => {
  await reset();
  await db.query(
    'insert into public.chat_conversations(order_id, created_by) values ($1, $2)',
    [order, tech],
  );
  await db.query(
    "insert into public.chat_messages(conversation_id, sender_id, body) select id, $1, 'Hola' from public.chat_conversations",
    [tech],
  );
  await reject();
  assert.equal((await snapshot()).conversations, 1);
  assert.equal((await snapshot()).messages, 2);
  const {
    rows: [conversation],
  } = await db.query('select last_message_at from public.chat_conversations');
  assert.ok(conversation.last_message_at);
});

test('RPC cannot be executed directly by anonymous or authenticated clients', async () => {
  const {
    rows: [privileges],
  } = await db.query(`select
    has_function_privilege('anon', 'public.reject_operation_completion(uuid,uuid,text)', 'execute') as anon,
    has_function_privilege('authenticated', 'public.reject_operation_completion(uuid,uuid,text)', 'execute') as authenticated,
    has_function_privilege('service_role', 'public.reject_operation_completion(uuid,uuid,text)', 'execute') as service`);
  assert.deepEqual(privileges, {
    anon: false,
    authenticated: false,
    service: true,
  });
});
