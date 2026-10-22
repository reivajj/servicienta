# Supabase

Esta carpeta contiene `migrations/`: los cambios SQL versionados de la base de
datos de Servicienta. `packages/supabase` contiene los clientes y helpers
compartidos que usan las aplicaciones.

## Tutorial completo

La guía central está en **[Inicio de sesión, proyecto y migraciones](../docs/supabase-workflow.md)**.
Incluye preparación del CLI, login con navegador o token personal, vinculación
del proyecto, revisión y aplicación de migraciones, entorno local y solución de
errores frecuentes.

## Inicio rápido contra el proyecto remoto

Ejecutá desde la **raíz del monorepo**, donde está el `package.json` principal:

```bash
pnpm install
pnpm exec supabase --version
pnpm exec supabase login
pnpm exec supabase projects list
pnpm exec supabase link --project-ref owplnnduqiicvftihaug
pnpm exec supabase migration list --linked
```

`login` autentica tu cuenta de Supabase. Seguí las instrucciones de la terminal
y el navegador. Si el navegador no se abre, usá
`pnpm exec supabase login --no-browser`.

Confirmá que la referencia corresponde al proyecto correcto y revisá los SQL
pendientes que indica `migration list`. Luego aplicalos y verificá el historial:

```bash
pnpm exec supabase migration up --linked
pnpm exec supabase migration list --linked
```

Si el CLI solicita una contraseña de base de datos, usá la contraseña PostgreSQL
del proyecto, no la de tu cuenta de Supabase.

El flag `--linked` apunta al proyecto remoto vinculado. Sin ese flag,
`migration up` apunta por defecto a Supabase local. Para el remoto no hace falta
levantar Docker.

Si ya tenés sesión y el proyecto correcto vinculado, podés comenzar en
`migration list --linked`. El vínculo se guarda localmente en `supabase/.temp/`.

## Si falta el binario del CLI

Si `pnpm exec supabase --version` responde `Command "supabase" not found`:

```bash
pnpm install
pnpm rebuild supabase
pnpm exec supabase --version
```

Para tokens, problemas de permisos, credenciales o uso de una base local,
consultá el [tutorial completo](../docs/supabase-workflow.md).
