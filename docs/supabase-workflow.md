# Supabase Workflow

_Última actualización: 2026-05-13_

## CLI

En este repo no hace falta tener `supabase` instalado globalmente.

Usar siempre el binario del workspace:

```bash
pnpm exec supabase --version
```

El CLI descarga su binario en el postinstall del paquete `supabase`. En pnpm 11
ese build está permitido desde `pnpm-workspace.yaml` con `allowBuilds`.
Si el comando responde `Command "supabase" not found`, refrescar la instalación
del workspace y reconstruir el paquete:

```bash
pnpm install
pnpm rebuild supabase
pnpm exec supabase --version
```

Como fallback puntual, se puede invocar el binario directo:

```bash
./node_modules/.bin/supabase --version
```

## Proyecto actual

Proyecto linkeado actualmente:

- `project-ref`: `owplnnduqiicvftihaug`

## Login

Si el CLI pide autenticación:

```bash
pnpm exec supabase login
```

## Aplicar migraciones remotas

Para empujar las migraciones pendientes al proyecto remoto:

```bash
pnpm exec supabase migration up --linked
```

Usar `--linked` es importante: sin ese flag, el CLI puede intentar conectarse
a la base local en `127.0.0.1:54322`.

Esto debería aplicar también nuevas migraciones como:

- `supabase/migrations/202605130001_move_technician_reviews_to_operations.sql`
- `supabase/migrations/202605270001_rework_client_selects_flow.sql`

## Migraciones locales

Para aplicar migraciones contra Supabase local, primero debe estar levantado el
stack local:

```bash
pnpm exec supabase start
pnpm exec supabase migration up
```

Para recrear la base local desde cero:

```bash
pnpm exec supabase db reset
```

`db reset` borra los datos locales y reaplica todas las migraciones.

## Relink del proyecto

Si `migration up --linked` falla porque el proyecto no está linkeado:

```bash
pnpm exec supabase link --project-ref owplnnduqiicvftihaug
pnpm exec supabase migration up --linked
```

El link del proyecto se guarda localmente en `supabase/.temp/project-ref` y
`supabase/.temp/linked-project.json`. Esa carpeta es estado local del CLI, no
configuración versionada del proyecto.

## Verificación sugerida

Después de correr las migraciones, conviene comprobar:

- que exista `public.client_profiles`
- que exista `public.admin_client_profiles`
- que los usuarios con `role = client` tengan su perfil creado
- que la vista `/client-profiles` cargue datos desde la app
- que `public.technician_reviews` use `operation_id` y no `order_id`
