# Supabase Workflow

_Última actualización: 2026-05-03_

## CLI

En este repo no hace falta tener `supabase` instalado globalmente.

Usar siempre el binario del workspace:

```bash
pnpm exec supabase --version
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
pnpm exec supabase db push
```

Esto debería aplicar también nuevas migraciones como:

- `supabase/migrations/202605030001_create_client_profiles.sql`

## Relink del proyecto

Si `db push` falla porque el proyecto no está linkeado:

```bash
pnpm exec supabase link --project-ref owplnnduqiicvftihaug
pnpm exec supabase db push
```

## Verificación sugerida

Después de correr las migraciones, conviene comprobar:

- que exista `public.client_profiles`
- que exista `public.admin_client_profiles`
- que los usuarios con `role = client` tengan su perfil creado
- que la vista `/client-profiles` cargue datos desde la app
