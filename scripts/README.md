# Scripts de testing y seeds

Esta carpeta contiene scripts operativos para generar datasets de prueba y
escenarios reproducibles en Servicienta.

## Objetivo

- crear usuarios reales en Supabase Auth
- reconciliar la tabla `public.users`
- poblar datasets determinísticos
- limpiar fixtures sin tocar data manual
- dejar una base escalable para futuras entidades de dominio

## Variables de entorno

Los scripts cargan automaticamente `scripts/.env` y `scripts/.env.local`.
Las variables ya exportadas en tu shell tienen prioridad.

Los scripts leen estas variables:

- `SUPABASE_URL` obligatorio
- `SUPABASE_SERVICE_ROLE_KEY` obligatorio
- `SEED_TAG` opcional, default `local-seed`
- `SEED_DEFAULT_PASSWORD` opcional, default `servicienta123`
- `SEED_TARGET` opcional, default `local`

## Comandos

Desde la raíz del repo:

```bash
pnpm seed:users -- --count 100
pnpm seed:users -- --count 100 --admins 10 --technicians 45 --clients 45
pnpm seed:technician-profiles -- --technicians 10
pnpm seed:scenario -- --scenario admin-basic
pnpm seed:scenario -- --scenario technician-search-basic
pnpm seed:scenario -- --scenario orders-operations-realistic
pnpm seed:reset-operational
pnpm seed:cleanup -- --tag local-seed
```

También podés ejecutar los entrypoints directamente:

```bash
TSX_TSCONFIG_PATH=tsconfig.scripts.json node --import tsx scripts/cli/seed-users.ts --count 100
TSX_TSCONFIG_PATH=tsconfig.scripts.json node --import tsx scripts/cli/seed-technician-profiles.ts --technicians 10
```

## Seed de technician-profiles

`seed-technician-profiles` toma hasta `--technicians N` usuarios con rol `technician`
ya existentes y les completa un dataset de búsqueda pública:

- 10 `appliance_types`
- 10 `brands`
- 10 `zones` de Buenos Aires
- `technician_profiles` con bio, `public_slug`, dirección base, lat/lng, radio y verificación
- `technician_appliance_specialties`
- `technician_brand_specialties`
- `technician_coverage_zones`
- `technician_documents`

Este seed ya no crea `technician_reviews`.
Las reviews operativas pasan a depender del seed de `orders` / `operations`.

Escenario recomendado para probar la búsqueda end-to-end:

```bash
pnpm seed:scenario -- --scenario technician-search-basic
```

## Convenciones actuales

- emails determinísticos: `seed-<tag>-<role>-<index>@servicienta.local`
- password compartida de testing
- metadata en Auth:
  - `seed_tag`
  - `seed_source`
  - `seed_scenario`
  - `seed_version`
- cleanup seguro por `seed_tag`

## Escenario inicial

`admin-basic` crea:

- 2 admins
- 5 technicians
- 5 clients

Sirve para probar login manual, tabla de `users`, edición, delete sobre terceros
y restore posterior.

## Escenario operativo

`orders-operations-realistic`:

- resetea el dataset seeded del entorno
- crea 2 admins, 8 technicians y 10 clients
- completa `technician_profiles`
- completa `client_profiles`
- crea 16 `orders`
- crea 12 `operations`
- crea 4 `technician_reviews` ligadas a `operations` reales

Comando:

```bash
pnpm seed:scenario -- --scenario orders-operations-realistic
```

Si querés ejecutar solo el reset operativo previo:

```bash
pnpm seed:reset-operational
```

## Verificación manual mínima

1. Ejecutar `pnpm seed:scenario -- --scenario admin-basic`.
2. Iniciar sesión con un admin seeded.
3. Abrir la pantalla `Users`.
4. Confirmar listado, edición, delete de un tercero y restore.

## Ejemplo de `scripts/.env`

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SEED_DEFAULT_PASSWORD=servicienta123
SEED_TAG=local-seed
SEED_TARGET=local
```
