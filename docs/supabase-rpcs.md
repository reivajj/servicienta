# Supabase RPCs

_Última actualización: 2026-10-26_

## Propósito

Este documento registra las funciones SQL de PostgreSQL que exponemos vía RPC en Supabase y que son consumidas por capas de aplicación del monorepo.

La fuente real de implementación sigue siendo:

- `supabase/migrations/*.sql`

Este documento existe para dejar claro:

- qué RPCs existen
- qué reciben
- qué devuelven
- qué capa las consume
- cuándo conviene usar una RPC en vez de seguir agregando lógica en `api-gateway`

## Regla general

En este repo, una RPC:

- se implementa como función SQL en PostgreSQL
- se versiona en migraciones de `supabase/`
- se tipa en `packages/supabase/src/database.ts`
- se consume desde `apps/api-gateway`

No duplicamos la lógica SQL en TypeScript.

`supabase.rpc(...)` es solo el mecanismo del cliente de Supabase para invocar una función de PostgreSQL expuesta por PostgREST.

## Cuándo usar RPC

Preferimos RPC cuando:

- la operación es de lectura o cálculo con joins/filtros complejos
- queremos evitar múltiples roundtrips desde Node
- la base puede resolver mejor la consulta que el backend
- la lógica pertenece claramente a persistencia/búsqueda, no a orquestación HTTP

No hace falta una RPC cuando:

- alcanza con una query simple sobre una tabla o vista
- la lógica es puramente HTTP o de autorización del gateway
- la operación se expresa mejor desde `api-gateway` con una sola query trivial

## RPCs actuales

### `public.search_public_technician_profiles`

Busca perfiles públicos de técnicos por zona y tipo de electrodoméstico, con filtro opcional por disponibilidad.

Implementación:

- [`supabase/migrations/202604150003_add_search_public_technician_profiles_rpc.sql`](/home/reivaj/0.ServiceApp/servicienta/supabase/migrations/202604150003_add_search_public_technician_profiles_rpc.sql)

Tipado:

- [`packages/supabase/src/database.ts`](/home/reivaj/0.ServiceApp/servicienta/packages/supabase/src/database.ts)

Consumo actual:

- [`apps/api-gateway/src/technician-profiles/service.ts`](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/technician-profiles/service.ts)

Firma:

```sql
public.search_public_technician_profiles(
  _zone_slug text,
  _appliance_type_slug text,
  _available boolean default null
)
```

Retorna:

- `public_slug`
- `bio`
- `rating`
- `rating_count`
- `available`
- `verified_at`
- `created_at`

Contrato de salida alineado con:

- `PublicTechnicianProfile`

### Motivo de diseño

Esta RPC se eligió en vez de resolver la búsqueda en Node porque el enfoque anterior:

- hacía múltiples queries
- resolvía intersecciones en memoria
- mezclaba filtrado de base con filtrado en backend
- usaba la tabla base en un endpoint y una vista pública en otro

La RPC actual:

- reduce roundtrips a una llamada
- mueve el filtrado a PostgreSQL
- evita duplicados usando `EXISTS`
- mantiene un contrato público estable

## Relación con vistas públicas

Las vistas públicas y las RPCs no compiten; cumplen roles distintos.

### Vista pública

Ejemplo:

- `public.public_technician_profiles`

Sirve para:

- proyección pública simple
- detalle público por `public_slug`
- evitar exponer columnas privadas

### RPC pública

Ejemplo:

- `public.search_public_technician_profiles`

Sirve para:

- búsqueda parametrizada
- joins y filtros más complejos
- encapsular lógica de matching en la base

## Checklist al agregar una nueva RPC

1. Crear migración SQL en `supabase/migrations/`
2. Definir grants/permisos correctos
3. Evaluar índices necesarios
4. Tiparla en `packages/supabase/src/database.ts`
5. Consumirla desde `apps/api-gateway`
6. Evitar duplicar la lógica SQL en TypeScript
7. Documentarla en este archivo si queda como contrato relevante del sistema


## Campos calculados para búsqueda operativa

`public.order_search_text(public.orders)` y
`public.operation_search_text(public.operations)` son campos virtuales para
filtrar con PostgREST, no endpoints RPC. Usan argumentos de fila sin nombre y
no se incluyen en las respuestas salvo selección explícita. Implementación:
`supabase/migrations/202610220001_add_order_operation_search_fields.sql`.

El gateway los filtra con `ilike` para cada palabra de búsqueda, tanto en listas
como en contadores. Combinan notas, nombre completo del cliente, nombres y slugs
de zona/artefacto y dirección. Visitas incluye la nota técnica y el texto del
pedido. Son `STABLE SECURITY INVOKER`, con `search_path` vacío y permisos solo
para `service_role`; no se exponen para búsquedas directas anónimas o de usuarios.


### Agenda operativa de pedidos

`public.order_next_visit_at(public.orders)` y `public.order_worklist(public.orders)`
son campos calculados PostgREST con argumento sin nombre, usados para ordenar y
filtrar las listas de pedidos del técnico. La primera calcula la próxima visita
agendada desde hoy (o la última agendada vencida); la segunda devuelve `main`,
`pending`, `waiting` o `history`. Se definen en
`supabase/migrations/202610220002_add_order_worklist_fields.sql`, con
`STABLE SECURITY INVOKER`, `search_path` vacío y ejecución solo por `service_role`.
La API sigue restringiendo cada consulta al dueño del pedido. No son RPCs
públicas y no almacenan copias de los datos.

## `reject_operation_completion`

Migración: [202610260001_reject_visit_completion_with_reason.sql](../supabase/migrations/202610260001_reject_visit_completion_with_reason.sql).

Recibe `_operation_id uuid`, `_client_id uuid`, `_reason text` y devuelve el UUID
de la visita. Solo `service_role` puede ejecutarla; el gateway obtiene el cliente
de la sesión autenticada, nunca del body. Valida rol, pertenencia, estado
`completed_tech` y motivo obligatorio de hasta 2000 caracteres.

Bloquea la visita y el pedido, guarda motivo y fecha propios (sin modificar la
descripción técnica), actualiza ambos estados, crea o reutiliza el chat del pedido,
asegura participación del cliente/técnico, publica un evento `operation.reject_completed`
con `sender_id` del cliente y registra auditoría con el ID del mensaje. Si falla
cualquier escritura, se revierte todo. Una repetición con el mismo motivo para una
visita ya rechazada devuelve el mismo ID sin duplicar el evento.

El endpoint es `POST /api/operations/:operationId/reject-completed` con
`{ "reason": "Qué quedó pendiente" }`. Errores SQL `P0002`, `22023` y `42501`
se traducen a HTTP 404, 400 y 403. El diálogo de mobile y web solicita el motivo
y confirma el envío explícitamente antes de llamar al endpoint.

Pruebas del contrato: `node --import tsx scripts/tests/reject-completion.test.mts`.
La prueba de SQL usa PostgreSQL embebido en una base descartable; instalar PGlite
fuera del repo (no es dependencia de la app) y ejecutar desde la raíz:

```bash
pnpm --dir /tmp/servicienta-rejection-sql add @electric-sql/pglite@0.5.12
PGLITE_MODULE=/tmp/servicienta-rejection-sql/node_modules/@electric-sql/pglite/dist/index.js node --import tsx scripts/tests/reject-completion-sql.test.mts
```

Cubre idempotencia, pertenencia, permisos de ejecución y rollback ante errores
simulados de chat y auditoría. No modifica Supabase remoto ni reemplaza una
prueba del flujo en el celular.
