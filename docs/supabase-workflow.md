# Supabase: inicio de sesión, proyecto y migraciones

_Última actualización: 2026-10-22_

Esta es la guía de referencia del repo para usar Supabase desde la terminal.
Los comandos se ejecutan desde la **raíz del monorepo**, donde está el
`package.json` principal, usando el CLI instalado en el workspace.

## 1. Preparar el CLI

Necesitás las dependencias del repo y una cuenta de Supabase con acceso al
proyecto. Para trabajar contra el proyecto remoto no hace falta levantar Docker.

```bash
pnpm install
pnpm exec supabase --version
```

No hace falta instalar `supabase` globalmente. Los comandos de esta guía se
verificaron con el CLI `2.98.2` instalado en el workspace.

Si aparece `Command "supabase" not found`, reconstruí el paquete para que
su instalación descargue el binario:

```bash
pnpm rebuild supabase
pnpm exec supabase --version
```

En este repo, `pnpm-workspace.yaml` permite ese build mediante `allowBuilds`.

## 2. Iniciar sesión

```bash
pnpm exec supabase login
```

Seguí las instrucciones que muestra la terminal: abrí el navegador si lo pide,
ingresá con tu cuenta de Supabase y completá la verificación indicada para
volver al CLI. Es el acceso a tu cuenta de desarrollo de Supabase; no es el
login de cliente o técnico dentro de Servicienta.

Si estás usando SSH, un contenedor o el navegador no se abre automáticamente:

```bash
pnpm exec supabase login --no-browser
```

Abrí manualmente el enlace que muestre el CLI en un navegador donde puedas
iniciar sesión y completá los pasos que indique la terminal.

Para comprobar que el CLI puede acceder a tus proyectos:

```bash
pnpm exec supabase projects list
```

Buscá el proyecto de Servicienta en el listado. Si aparece un error de permisos,
comprobá que usaste la cuenta correcta y que tiene acceso a su organización.

### Alternativa: token personal en la terminal

Para un entorno sin login interactivo, generá un token desde
[Access Tokens de tu cuenta](https://supabase.com/dashboard/account/tokens).
Es un **Personal Access Token**: las claves `anon`, `publishable` o
`service_role` del proyecto no sirven para autenticar el CLI.

En Bash o Zsh, estos comandos permiten pegarlo sin escribir el valor en el
historial de comandos. Después del primer comando, pegá el token y pulsá Enter;
la entrada no se muestra:

```bash
read -r -s SUPABASE_ACCESS_TOKEN
export SUPABASE_ACCESS_TOKEN
pnpm exec supabase projects list
```

La variable queda disponible para los comandos siguientes en esa terminal.
En CI, configurá `SUPABASE_ACCESS_TOKEN` como secreto del entorno. No lo guardes
en archivos versionados ni lo pegues en chats.

Cuando termines de usarlo en la terminal:

```bash
unset SUPABASE_ACCESS_TOKEN
```

El login interactivo guarda su credencial localmente. La variable de entorno
permite autenticar esa terminal sin depender de una sesión guardada. No hace
falta usar ambas alternativas.

## 3. Vincular el proyecto remoto

El login identifica tu cuenta; `link` indica sobre qué proyecto va a trabajar
este checkout del repo.

La referencia de Servicienta documentada en este repo es:

```text
owplnnduqiicvftihaug
```

Confirmala en el listado de proyectos o en los ajustes del proyecto en el
Dashboard y luego ejecutá:

```bash
pnpm exec supabase link --project-ref owplnnduqiicvftihaug
```

Si el CLI solicita una contraseña, corresponde a la **base PostgreSQL del
proyecto**, no a tu contraseña de cuenta ni a una API key. Se administra en los
ajustes de base de datos del Dashboard.

El vínculo queda guardado en `supabase/.temp/`. Es estado local del desarrollador:
un checkout en otra computadora puede necesitar volver a iniciar sesión y
vincularse. No edites esos archivos a mano para cambiar de proyecto; usá `link`
con la referencia correcta.

## 4. Revisar las migraciones pendientes

```bash
pnpm exec supabase migration list --linked
```

El listado compara las versiones de `supabase/migrations/` con las registradas
en el proyecto remoto. Una versión presente en `Local` pero ausente en `Remote`
está pendiente. Abrí los archivos SQL pendientes para revisar qué van a cambiar.

El comando para aplicar migraciones procesa las pendientes, no solamente la
última que hayas creado.

## 5. Aplicar y verificar

```bash
pnpm exec supabase migration up --linked
pnpm exec supabase migration list --linked
```

`--linked` dirige la operación al proyecto remoto vinculado. Sin ese flag,
`migration up` apunta por defecto a una base local.

Al terminar, las versiones aplicadas deben aparecer tanto en `Local` como en
`Remote`. Después, verificá la funcionalidad afectada en la app. Si modificaste
funciones o tablas usadas por el gateway, comprobá también que la API pueda
consultarlas.

Si una migración falla, leé el error y revisá el estado con `migration list`
antes de reintentar. No marques una versión como aplicada para ocultar un error.
Las migraciones ya compartidas o aplicadas se corrigen con una migración nueva.

## Secuencia rápida para este repo

Después de instalar las dependencias, ejecutá los comandos en orden y continuá
con la aplicación de migraciones cuando hayas revisado las pendientes:

```bash
pnpm exec supabase login
pnpm exec supabase projects list
pnpm exec supabase link --project-ref owplnnduqiicvftihaug
pnpm exec supabase migration list --linked
pnpm exec supabase migration up --linked
pnpm exec supabase migration list --linked
```

Si ya tenés sesión y el checkout está vinculado al proyecto correcto, alcanza
con revisar, aplicar y volver a listar las migraciones.

## Crear una migración nueva

```bash
pnpm exec supabase migration new nombre_del_cambio
```

El CLI crea un archivo SQL con una versión nueva en `supabase/migrations/`.
Completalo, revisalo y probalo antes de aplicarlo al remoto. No reutilices la
versión de una migración anterior.

## Trabajar con Supabase local

Esta alternativa usa Docker y una base separada del proyecto remoto. Si este
checkout todavía no tiene `supabase/config.toml`, inicializá primero la
configuración local:

```bash
pnpm exec supabase init
```

Luego:

```bash
pnpm exec supabase start
pnpm exec supabase migration up --local
pnpm exec supabase status
```

Para detener el stack local:

```bash
pnpm exec supabase stop
```

Para recrear la base **local** y volver a ejecutar sus migraciones:

```bash
pnpm exec supabase db reset --local
```

Este último comando borra los datos locales. No lo uses como paso para aplicar
migraciones remotas. `supabase status` muestra el estado del stack local; no
reemplaza `projects list` para verificar el acceso a la cuenta.

## Problemas frecuentes

| Mensaje o situación | Qué revisar |
| --- | --- |
| `Access token not provided` | Ejecutá `pnpm exec supabase login` en este entorno o exportá un token personal válido como `SUPABASE_ACCESS_TOKEN`. |
| El navegador no se abre | Usá `login --no-browser` y completá el flujo desde el enlace que muestra el CLI. |
| Token vencido, revocado o error de permisos | Volvé a iniciar sesión o renová el token. Si exportaste `SUPABASE_ACCESS_TOKEN`, revisá esa variable también. Confirmá el acceso de tu cuenta al proyecto. |
| El proyecto no está vinculado | Ejecutá `link --project-ref` con la referencia correcta. |
| Solicitud o error de contraseña de base de datos | Usá la contraseña PostgreSQL del proyecto; el token personal y las API keys son credenciales distintas. |
| Intenta conectarse a `127.0.0.1:54322` | Estás usando una operación local. Para migraciones remotas, agregá `--linked`. |
| El historial local y remoto difiere | Compará `migration list --linked` con los archivos del repo. Revisá la causa antes de usar herramientas de reparación del historial. |
| El CLI no funciona desde otro entorno | El login y el vínculo pueden no existir allí. Repetí los pasos de autenticación y vinculación en ese entorno. |

## Referencias

- [Carpeta Supabase del repo](../supabase/README.md)
- [Funciones SQL y RPCs del proyecto](./supabase-rpcs.md)
- [Workflow oficial de Supabase](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Referencia del CLI](https://supabase.com/docs/reference/cli/introduction)
- [Tokens personales](https://supabase.com/docs/guides/platform/personal-access-tokens)
