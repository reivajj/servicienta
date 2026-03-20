# Servicienta — Fuente de verdad provisional

_Última actualización: 2026-03-19_

## Propósito de este documento

Este documento consolida el estado actual de entendimiento del proyecto en un solo lugar.

No es un contrato definitivo.
Es un punto de partida para alinear arquitectura, modelo de datos y decisiones de implementación mientras el producto todavía está en etapa de exploración.

Todo lo que aparece acá es discutible.
Seguramente vamos a:

- renombrar entidades
- agregar nuevas entidades
- eliminar entidades
- sumar campos
- cambiar relaciones
- ajustar flujos de negocio

La idea es tener una base común para trabajar, no congelar el diseño.

## Estado actual del proyecto

### Stack definido

- Monorepo con `Turborepo` + `pnpm workspaces`
- `apps/web`: React + Vite SPA con auth y rutas protegidas
- `apps/landing`: Next.js App Router para landing pública con SSR y SEO
- `apps/api-gateway`: Node/Express API Gateway
- `packages/types`: tipos y contratos compartidos
- `packages/api-client`: cliente HTTP tipado
- `packages/query-hooks`: hooks de TanStack Query
- `packages/supabase`: cliente y helpers compartidos de Supabase
- Supabase como auth, base de datos y potencial capa realtime

### Estado del codebase hoy

Hoy el repo implementa solo una porción mínima de esta visión.

Existió una prueba funcional con una tabla `technicians` y un flujo simple de listado de técnicos, pero ya fue removida para evitar confusión y no debe tomarse como modelo del negocio.

## Aclaración importante sobre el experimento `technicians`

La entidad o tabla `technicians` fue una prueba vertical para validar:

- integración frontend ↔ api-gateway
- cliente compartido
- query hooks
- conexión con Supabase
- auth básica

No representa el modelo real deseado.

El modelo real apunta a `TechnicianProfile`.

Entonces:

- `technicians` fue solo un experimento temporal
- `TechnicianProfile` es la dirección correcta
- esa prueba ya fue retirada del repo

## Principios del modelo actual

### 1. `User` como base de identidad

La tabla base es `User`.

Su responsabilidad es:

- identidad
- auth
- rol principal
- metadata común a cualquier actor

Campos base esperados:

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK |
| `email` | `string` | identidad principal |
| `name` | `string` | nombre visible |
| `role` | `enum` | `admin \| technician \| client` |
| `created_at` | `timestamp` | auditoría |

### 2. Perfiles separados por rol

La información específica de cada tipo de usuario no debería vivir en `User`.

Por ahora la dirección preferida es:

- `TechnicianProfile`
- `ClientProfile`

Ambos comparten `id` con `User`.

Esto permite:

- evitar columnas nullable innecesarias en la tabla base
- separar identidad de perfil de negocio
- mantener auth más limpia en Supabase
- crecer cada perfil sin contaminar el resto del modelo

## Entidades provisionales

### User

Entidad base de identidad y autenticación.

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK |
| `email` | `string` | |
| `name` | `string` | |
| `role` | `enum` | `admin \| technician \| client` |
| `created_at` | `timestamp` | |

### TechnicianProfile

Perfil del técnico.
Es la dirección real que reemplaza al experimento `technicians`.

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK = FK → `User.id` |
| `specialty` | `string` | rubro / especialidad |
| `bio` | `string` | descripción pública |
| `rating` | `decimal` | calculado o derivado |
| `available` | `boolean` | visibilidad / disponibilidad |
| `...` | | a definir |

Notas:

- puede sumar zonas de cobertura, documentación, pricing, verificación y reputación
- es probable que esta entidad crezca bastante
- el schema actual todavía no la implementa como tal

### ClientProfile

Perfil del cliente.

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK = FK → `User.id` |
| `phone` | `string` | |
| `address` | `string` | probablemente evolucione |
| `...` | | a definir |

### Subscription

Solo aplica a técnicos.
Representa el pago recurrente del técnico a la plataforma.

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK |
| `technician_id` | `uuid` | FK → `User` |
| `status` | `enum` | `active \| paused \| cancelled` |
| `billing_cycle` | `enum` | `monthly \| annual` |
| `next_billing_date` | `timestamp` | |

### Order

Entidad central del negocio.
La crea un cliente.

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK |
| `client_id` | `uuid` | FK → `User` |
| `status` | `enum` | `open \| in_progress \| en_garantia \| closed` |
| `flow_type` | `enum` | `client_selects \| tech_applies` |
| `description` | `string` | |
| `created_at` | `timestamp` | |

### Operation

Una `Operation` vincula un técnico concreto con una `Order`.

Regla actual de diseño:
una `Order` puede tener múltiples `Operation`, pero una `Operation` corresponde a un solo técnico.

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK |
| `order_id` | `uuid` | FK → `Order` |
| `technician_id` | `uuid` | FK → `User` |
| `status` | `enum` | `pending \| confirmed \| completed \| cancelled` |
| `scheduled_at` | `timestamp` | nullable |
| `completed_at` | `timestamp` | nullable |

### Payment

Movimiento de dinero desde client hacia plataforma.

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK |
| `payer_id` | `uuid` | FK → `User` |
| `reference_id` | `uuid` | apunta a `Order` o `Subscription` |
| `reference_type` | `enum` | `order \| subscription` |
| `amount` | `decimal` | |
| `status` | `enum` | `pending \| paid \| failed` |
| `paid_at` | `timestamp` | nullable |

### Payout

Movimiento de dinero desde plataforma hacia técnico.

`Payment` y `Payout` son entidades separadas porque no necesariamente comparten el mismo estado en el tiempo.

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK |
| `technician_id` | `uuid` | FK → `User` |
| `payment_id` | `uuid` | FK → `Payment` |
| `amount` | `decimal` | |
| `status` | `enum` | `retained \| available \| paid` |
| `available_after` | `timestamp` | fin del período de garantía |
| `paid_at` | `timestamp` | nullable |

### ActivityEvent

Capa transversal para auditoría, analytics y eventos de sistema.

| campo | tipo | notas |
|---|---|---|
| `id` | `uuid` | PK |
| `actor_id` | `uuid` | FK → `User` |
| `entity_type` | `string` | `order \| operation \| payment \| ...` |
| `entity_id` | `uuid` | |
| `event_type` | `string` | `created \| status_changed \| completed \| ...` |
| `payload` | `json` | nullable |
| `created_at` | `timestamp` | |

## Relaciones provisionales

```txt
User          1 → N    Order
User          1 → 0..1 Subscription
User          1 → 0..1 TechnicianProfile
User          1 → 0..1 ClientProfile
Order         1 → N    Operation
User (tech)   1 → N    Operation
Order         1 → N    Payment
Subscription  1 → N    Payment
Payment       1 → 0..1 Payout
User (tech)   1 → N    Payout
User          1 → N    ActivityEvent
```

## Flujos de negocio provisionales

### Flujo A: `client_selects`

Es el flujo prioritario por ahora.

1. El cliente crea una `Order`
2. Busca técnicos
3. Selecciona uno
4. Se crea una `Operation`
5. El técnico completa el trabajo
6. La orden entra en `en_garantia`
7. Luego pasa a `closed`

### Flujo B: `tech_applies`

No es prioridad inmediata.

1. El cliente crea una `Order`
2. Técnicos se postulan
3. El cliente elige uno
4. Se confirma una `Operation`
5. El resto del flujo continúa igual

### Flujo de pagos provisional

1. El cliente paga
2. Se registra `Payment`
3. Al completarse la operación se crea `Payout`
4. El payout puede quedar retenido hasta terminar la garantía
5. Luego queda disponible
6. Finalmente queda pagado

## Decisiones tomadas hasta ahora

- Monorepo con `apps/` deployables y `packages/` compartidos
- `api-client` como capa HTTP tipada
- `query-hooks` como capa React Query sobre `api-client`
- `User` como base de identidad
- perfiles separados por rol en vez de meter toda la data en `User`
- `Operation` como entidad puente entre `Order` y técnico
- `Payment` y `Payout` separados
- `flow_type` en `Order` para soportar ambos modos del negocio
- `ActivityEvent` como entidad genérica inicial

## Lo que no debe interpretarse como cerrado

Nada de esto implica que:

- el naming final ya esté decidido
- los enums sean definitivos
- las relaciones estén totalmente cerradas
- las policies de autorización ya estén definidas
- la estrategia de pagos esté resuelta
- el modelado actual de perfiles sea el final
- el schema actual de Supabase represente el producto final

## Distancia entre visión y código actual

Hoy el repo real está mucho más cerca de un prototipo técnico que de este modelo de negocio completo.

Implementado hoy:

- SPA web con auth básica
- API gateway simple
- cliente compartido
- query hooks
- integración básica con Supabase
- ya no existe una entidad runtime de técnicos en el repo

No implementado todavía:

- `User` + perfiles reales
- `Order`
- `Operation`
- `Subscription`
- `Payment`
- `Payout`
- `ActivityEvent`
- RLS completo por rol
- microservicios reales
- landing SSR funcional

## Regla práctica para próximas tareas

Si hay conflicto entre:

- una prueba técnica temporal del repo
- y este documento

debemos asumir que la prueba técnica es descartable y que la intención del modelo va hacia:

- `User`
- `TechnicianProfile`
- `ClientProfile`
- `Order`
- `Operation`
- `Payment`
- `Payout`
- `ActivityEvent`

salvo que en una conversación futura decidamos otra cosa.

## Pendientes abiertos

### Schema

- definir campos completos de `TechnicianProfile`
- definir campos completos de `ClientProfile`
- definir mejor `address`
- decidir si ratings viven en `Operation` o en una entidad aparte
- tipar eventos válidos de `ActivityEvent`
- definir duración de garantía

### Autorización

- qué puede ver un `client`
- qué puede ver un `technician`
- qué puede ver un `admin`
- qué parte del perfil técnico es pública
- RLS por tabla y por rol

### API y lógica de negocio

- endpoints de Flujo A
- endpoints de Flujo B
- reglas de transición de estados
- momento exacto de creación de `Payment`
- estrategia landing: `api-gateway` vs acceso directo a Supabase

### Infraestructura

- estrategia de deploy por app
- estrategia de variables de entorno del monorepo
- caché remota de Turborepo

## Próximo uso recomendado

Usar este documento como referencia de trabajo para:

- diseñar nuevos tipos en `packages/types`
- planificar migraciones de Supabase
- discutir endpoints
- definir permisos
- detectar qué partes del repo actual son prototipo y cuáles son base real

Si aparece nueva información o cambiamos de opinión, este documento debe actualizarse.
