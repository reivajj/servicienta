# Supabase

Esta carpeta contiene la definicion de base de datos del proyecto:

- `migrations/`: cambios versionados del schema

## Aplicar migraciones

Usar siempre el binario del workspace:

```bash
pnpm exec supabase migration up --linked
```

El flag `--linked` aplica las migraciones contra el proyecto remoto linkeado.
Sin ese flag, el CLI puede intentar conectarse a Supabase local.

Si `pnpm exec supabase --version` responde `Command "supabase" not found`,
significa que pnpm no ejecuto todavía el build script que descarga el binario
del CLI. Refrescar la instalación del workspace y reconstruir:

```bash
pnpm install
pnpm rebuild supabase
pnpm exec supabase --version
```

El link remoto queda guardado por Supabase CLI en `supabase/.temp/`; esa carpeta
es estado local del developer, no configuracion versionada.

Para mas detalle ver `docs/supabase-workflow.md`.

El package `packages/supabase` queda reservado para el cliente compartido y
helpers de autenticacion para las apps.
