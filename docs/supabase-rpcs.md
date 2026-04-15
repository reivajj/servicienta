# Supabase RPCs

_Última actualización: 2026-04-15_

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
