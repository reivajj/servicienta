# Supabase

Esta carpeta contiene la definicion de base de datos del proyecto:

- `migrations/`: cambios versionados del schema

## Aplicar migraciones

Usar siempre el binario del workspace:

```bash
pnpm supabase migration up --linked
```

El flag `--linked` aplica las migraciones contra el proyecto remoto linkeado.
Sin ese flag, el CLI puede intentar conectarse a Supabase local.

El link remoto queda guardado por Supabase CLI en `supabase/.temp/`; esa carpeta
es estado local del developer, no configuracion versionada.

Para mas detalle ver `docs/supabase-workflow.md`.

El package `packages/supabase` queda reservado para el cliente compartido y
helpers de autenticacion para las apps.
