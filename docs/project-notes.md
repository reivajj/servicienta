# Notas del proyecto — Schema & arquitectura

_Última actualización: 2026-03-19_

---

## Stack definido

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend SPA**: React + Vite (`apps/web`) — auth, rutas protegidas
- **Landing**: Next.js App Router (`apps/landing`) — SSR, público, SEO
- **API**: Node/Express API Gateway + microservicios (`apps/api-gateway`, `apps/service-*`)
- **Auth + DB + Realtime**: Supabase
- **Estado del servidor**: TanStack Query (`packages/query-hooks`)
- **Comunicación tipada**: `packages/api-client` + `packages/types`

---

## Entidades — schema actual

### User
Tabla base de identidad y auth (Supabase Auth).

| campo | tipo | notas |
|---|---|---|
| id | uuid | PK — compartido con perfiles |
| email | string | |
| name | string | |
| surname | string | |
| role | text | con `check`, valores `admin · technician · client` |
| created_at | timestamp | |

### TechnicianProfile _(a definir)_
Extiende `User` con data específica del técnico. Comparte `id` con `User`.

| campo | tipo | notas |
|---|---|---|
| id | uuid | PK = FK → User.id |
| specialty | string | rubro / especialidad |
| bio | string | descripción pública |
| rating | decimal | calculado |
| available | boolean | aparece en landing |
| ... | | a definir |

### ClientProfile _(a definir)_
Extiende `User` con data específica del cliente. Comparte `id` con `User`.

| campo | tipo | notas |
|---|---|---|
| id | uuid | PK = FK → User.id |
| phone | string | |
| address | string | |
| ... | | a definir |

> **Patrón**: `User` maneja auth e identidad. `TechnicianProfile` y `ClientProfile` tienen solo la data que les corresponde. Al crear un usuario con `role = technician`, se crea también el `TechnicianProfile` con el mismo `id`. Sin joins innecesarios, sin columnas nullable en la tabla base.

### Subscription
Solo técnicos. Modela el pago recurrente a la plataforma.

| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| technician_id | uuid | FK → User |
| status | enum | `active · paused · cancelled` |
| billing_cycle | enum | `monthly · annual` |
| next_billing_date | timestamp | |

### Order
Creada por un client. Soporta flujo A y flujo B.

| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| client_id | uuid | FK → User |
| status | enum | `open · in_progress · en_garantia · closed` |
| flow_type | enum | `client_selects · tech_applies` |
| description | string | |
| created_at | timestamp | |

### Operation
Una operación = un técnico asignado a una Order. Una Order puede tener múltiples Operations (tech cancela, garantía, etc.).

| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK → Order |
| technician_id | uuid | FK → User |
| status | enum | `pending · confirmed · completed · cancelled` |
| scheduled_at | timestamp | nullable |
| completed_at | timestamp | nullable |

### Payment
Movimiento de dinero client → plataforma.

| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| payer_id | uuid | FK → User (client) |
| reference_id | uuid | FK → Order o Subscription |
| reference_type | enum | `order · subscription` |
| amount | decimal | |
| status | enum | `pending · paid · failed` |
| paid_at | timestamp | nullable |

### Payout
Movimiento de dinero plataforma → técnico. Estado independiente de Payment.

| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| technician_id | uuid | FK → User |
| payment_id | uuid | FK → Payment (origen) |
| amount | decimal | |
| status | enum | `retained · available · paid` |
| available_after | timestamp | fin del período EN_GARANTIA |
| paid_at | timestamp | nullable |

### ActivityEvent
Capa transversal. Analytics, auditoría, notificaciones.

| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| actor_id | uuid | FK → User |
| entity_type | string | `order · operation · payment · ...` |
| entity_id | uuid | |
| event_type | string | `created · status_changed · completed · ...` |
| payload | json | nullable |
| created_at | timestamp | |

---

## Relaciones

```
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

---

## Flujos de negocio

### Flujo A — client selects _(prioridad)_
1. Client crea una Order (`flow_type = client_selects`)
2. Client busca y selecciona técnicos — cada consulta puede vincularse a la Order
3. Al acordar una cita → se crea una Operation con el tech elegido (`status = confirmed`)
4. Tech completa el trabajo → `Operation.status = completed`, `Order.status = en_garantia`
5. Vence período de garantía → `Order.status = closed`, `Payout.status = available`

### Flujo B — tech applies _(secundario, a implementar después)_
1. Client crea una Order (`flow_type = tech_applies`)
2. Técnicos se postulan → se crean Operations en `status = pending`
3. Client elige uno → Operation pasa a `status = confirmed`, resto a `cancelled`
4. Resto del flujo igual al Flujo A

### Flujo de pagos
```
Client paga         → Payment (status: paid)
Operation completa  → Payout creado (status: retained, available_after: +X días)
Garantía vence      → Payout (status: available)
Plataforma transfiere → Payout (status: paid)
```

---

## Decisiones tomadas

| decisión | razonamiento |
|---|---|
| `User` con `role` + perfiles separados | Auth limpio en Supabase, data específica sin columnas nullable en la tabla base |
| `Operation` como entidad puente | Permite múltiples techs por Order sin romper el modelo |
| `Payment` + `Payout` separados | Estados independientes — el client puede haber pagado mientras el payout está retenido |
| `flow_type` en Order | Ambos flujos conviven en el mismo modelo sin duplicar tablas |
| `available_after` en Payout | Modela el período EN_GARANTIA sin lógica externa |
| `ActivityEvent` genérica | Suficiente para arrancar; se tipea mejor cuando haya más claridad sobre analytics |

---

## Pendientes — decisiones abiertas

### Schema
- [ ] Definir campos completos de `TechnicianProfile` (especialidades, zonas de cobertura, documentación, etc.)
- [ ] Definir campos completos de `ClientProfile`
- [ ] Tipar los `event_type` válidos por entidad en `ActivityEvent`
- [ ] Definir duración del período de garantía (¿fija? ¿configurable por Order?)

### Reglas de acceso / autorización
- [ ] **Client**: solo ve sus propias Orders, Payments y Operations vinculadas
- [ ] **Technician**: solo ve Operations donde es el asignado; ve Orders públicas para postularse (flujo B)
- [ ] **Admin**: acceso completo a todo
- [ ] Definir qué datos del `TechnicianProfile` son públicos (landing, búsqueda) vs privados
- [ ] Row Level Security (RLS) policies en Supabase para cada tabla
- [ ] ¿Puede un client ver el perfil de un tech con el que no tiene una Operation activa?

### API & lógica de negocio
- [ ] Endpoints para Flujo A (prioridad): crear Order, buscar techs, crear Operation, completar Operation
- [ ] Validaciones de transición de estado (quién puede cambiar qué estado)
- [ ] ¿Quién crea el Payment y cuándo? (¿al confirmar Operation, o al completarla?)
- [ ] ¿La landing (Next.js) obtiene datos via api-gateway o directo a Supabase?
- [ ] Definir qué eventos disparan notificaciones y por qué canal

### Infraestructura
- [ ] Confirmar plataformas de deploy por app
- [ ] Definir estrategia de variables de entorno entre apps del monorepo
- [ ] Remote cache de Turborepo (turbo.build o self-hosted)

---

## Próximos pasos sugeridos

1. Definir `TechnicianProfile` y `ClientProfile` con todos sus campos
2. Mapear reglas de acceso por rol antes de escribir código
3. Arrancar `packages/types` con las interfaces y enums definidos hasta acá
4. Migración de schema a Supabase (tablas + RLS básico)
5. Primer endpoint: crear Order (Flujo A)
