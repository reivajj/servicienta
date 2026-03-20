# Servicienta

Monorepo del proyecto Servicienta.

Este repo usa `Turborepo` + `pnpm workspaces` para organizar apps deployables y paquetes compartidos.

## Estado actual

El codebase está en etapa de prototipo.

Hoy ya existe una base técnica funcional para:

- `apps/web`: SPA en React + Vite
- `apps/api-gateway`: API Gateway en Node/Express
- `packages/api-client`: cliente HTTP tipado
- `packages/query-hooks`: hooks sobre TanStack Query
- `packages/supabase`: cliente y helpers compartidos de Supabase
- `packages/types`: contratos compartidos

Todavía hay partes incompletas, placeholders y decisiones abiertas.

## Fuente de verdad provisional

La referencia principal del proyecto está en:

- [docs/source-of-truth.md](./docs/source-of-truth.md)

Ese documento explica:

- modelo de entidades provisional
- arquitectura objetivo
- diferencias entre visión y código actual
- qué partes son prototipo y cuáles son dirección real del proyecto

Importante:

- el experimento `technicians` fue removido para evitar confusión
- la dirección real del modelo apunta a `TechnicianProfile`
- todo el schema actual sigue siendo discutible

## Estructura del repo

```txt
apps/
  api-gateway/   API Gateway Express
  landing/       Landing SSR (placeholder)
  web/           Frontend SPA React + Vite

packages/
  api-client/    Cliente HTTP tipado
  config/        Configuración compartida
  query-hooks/   Hooks de TanStack Query
  supabase/      Cliente y helpers compartidos
  types/         Tipos y contratos
  validators/    Validaciones compartidas (pendiente)

docs/            Documentación de trabajo
supabase/        Migraciones y assets de Supabase
```

## Comandos

Desde la raíz:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm check-types
```

También podés usar filtros con `turbo`:

```bash
pnpm turbo dev --filter=web
pnpm turbo dev --filter=@servicienta/api-gateway
pnpm turbo build --filter=web...
```

## Variables de entorno

Archivos actuales:

- `apps/web/.env.example`
- `apps/api-gateway/.env.example`

Variables principales:

### `apps/web`

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### `apps/api-gateway`

- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Supabase

La carpeta `supabase/` contiene las migraciones del proyecto.

Hoy no hay un schema definitivo implementado para el modelo real del negocio.

## Otras notas

- El `README` raíz anterior venía del starter de Turborepo y ya no describía este repo correctamente.
- Parte de la documentación en `docs/` es exploratoria; usar `docs/source-of-truth.md` como referencia principal de trabajo.
- `apps/landing`, `packages/validators` y otras piezas todavía están en etapa temprana o placeholder.
