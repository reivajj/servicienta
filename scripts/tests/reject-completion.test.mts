import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createApiClient } from '../../packages/api-client/src/core/client.ts';
import { validateRejectCompletedOperationInput } from '../../apps/api-gateway/src/operations/validators.ts';
import { rejectCompletedOperation } from '../../apps/api-gateway/src/operations/service.ts';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../apps/api-gateway/src/core/errors.ts';

test('reject completion contract requires a trimmed explanation of up to 2000 characters', () => {
  for (const value of [
    undefined,
    null,
    {},
    { reason: 4 },
    { reason: '' },
    { reason: ' \n ' },
    { reason: 'a'.repeat(2001) },
  ]) {
    assert.throws(
      () => validateRejectCompletedOperationInput(value),
      ValidationError,
    );
  }
  assert.deepEqual(
    validateRejectCompletedOperationInput({
      reason: '  Falta terminar\nla reparación.  ',
    }),
    { reason: 'Falta terminar\nla reparación.' },
  );
  assert.equal(
    validateRejectCompletedOperationInput({ reason: 'a'.repeat(2000) }).reason
      .length,
    2000,
  );
});

test('API client sends the reason only when explicitly called', async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const api = createApiClient({
    baseUrl: 'https://example.test',
    fetch: async (url, init) => {
      requests.push({ url: String(url), init });
      return new Response(JSON.stringify({ data: { id: 'visit' } }), {
        status: 200,
      });
    },
  });
  assert.equal(requests.length, 0);
  await api.operations.rejectCompleted('visit', {
    reason: 'La reparación sigue pendiente',
  });
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0]?.url,
    'https://example.test/api/operations/visit/reject-completed',
  );
  assert.equal(requests[0]?.init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(requests[0]?.init?.body)), {
    reason: 'La reparación sigue pendiente',
  });
});

test('gateway checks client role and reason before invoking the transaction', async () => {
  const unused = {} as SupabaseClient;
  await assert.rejects(
    rejectCompletedOperation(
      unused,
      { id: 'tech', email: 'tech@example.test', role: 'technician' },
      'visit',
      { reason: 'Falta reparar' },
    ),
    ForbiddenError,
  );
  await assert.rejects(
    rejectCompletedOperation(
      unused,
      { id: 'client', email: 'client@example.test', role: 'client' },
      'visit',
      { reason: ' ' },
    ),
    ValidationError,
  );
});

test('gateway uses the authenticated client as author and translates transaction errors', async () => {
  for (const [code, Expected] of [
    ['P0002', NotFoundError],
    ['22023', ValidationError],
    ['42501', ForbiddenError],
  ] as const) {
    const fake = {
      rpc: async (name: string, args: unknown) => {
        assert.equal(name, 'reject_operation_completion');
        assert.deepEqual(args, {
          _operation_id: 'visit',
          _client_id: 'authenticated-client',
          _reason: 'Falta reparar',
        });
        return { error: { code, message: 'Rejected' } };
      },
    } as unknown as SupabaseClient;
    await assert.rejects(
      rejectCompletedOperation(
        fake,
        {
          id: 'authenticated-client',
          email: 'client@example.test',
          role: 'client',
        },
        'visit',
        { reason: '  Falta reparar  ' },
      ),
      Expected,
    );
  }
});
