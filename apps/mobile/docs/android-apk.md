# APK Android para pruebas internas

_Última actualización: 2026-10-26._

Servicienta usa EAS Build para generar una APK firmada que se instala directamente
en Android, sin Google Play, Expo Go ni un servidor de desarrollo Metro.

## Configuración del proyecto

- Proyecto Expo: [@reivajj/servicienta](https://expo.dev/accounts/reivajj/projects/servicienta).
- Identificador Android: `com.servicienta.mobile`.
- Perfil: `preview` en [`eas.json`](../eas.json).
- Distribución interna y formato `apk`, con incremento automático del número de
  compilación administrado por EAS. La versión visible sigue en `app.json`.
- Entorno EAS: `preview`.
- Node `22.22.2`, pnpm `11.1.1` y EAS CLI `25.3.0`.

En este monorepo, los comandos EAS se ejecutan desde `apps/mobile`. Los scripts del
repo ya hacen ese cambio de directorio mediante el filtro de pnpm.

Primer build iniciado el 2026-10-26: [ver estado y descarga en Expo](https://expo.dev/accounts/reivajj/projects/servicienta/builds/a71e8e83-1f38-4e76-b92f-3c9aa328770d).
Última consulta del 2026-10-26: `IN_QUEUE`, sin artefacto de descarga. El estado
puede cambiar después de este cierre; consultar el enlace para el resultado actual.
La APK está disponible únicamente cuando el estado del build sea `Finished`.
Se generó el keystore administrado por EAS y la versión nativa de este build es
`2` (versión visible `0.1.0`). No se probó instalación en teléfono ni se publicó en
Google Play.

Para consultar el estado sin iniciar otro build, desde `apps/mobile`:

```bash
pnpm dlx eas-cli@25.3.0 build:view a71e8e83-1f38-4e76-b92f-3c9aa328770d
```

## API y variables del APK

El entorno `preview` de EAS debe contener estas variables:

| Variable | Uso |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | `https://servicienta-api.vercel.app`, sin `/api` al final. |
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase usado por el gateway. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave pública/publishable del mismo proyecto. |

Las tres variables ya se cargaron en el entorno `preview` del proyecto. Se
administran en el panel de Expo. Para reemplazar la URL de API desde `apps/mobile`:

```bash
pnpm dlx eas-cli@25.3.0 env:create preview --name EXPO_PUBLIC_API_URL --value https://servicienta-api.vercel.app --visibility plaintext --force
```

Las tres variables se incorporan al bundle y son públicas. Nunca usar una clave
`service_role`. Los archivos `.env` locales quedan excluidos del archivo enviado
a EAS; la APK toma sus variables del entorno `preview`, no de la IP de desarrollo.
Cambiar estas variables requiere generar otra APK; no se configuró EAS Update.

El hook `eas-build-pre-install` verifica variables obligatorias y URLs HTTPS sin
rutas adicionales del gateway ni direcciones de la red local. El hook
`eas-build-post-install` compila `@servicienta/types`, cuyo `dist` está excluido de
Git/EAS y es necesario para Metro.

El endpoint `https://servicienta-api.vercel.app/health` respondió `{"ok":true}`
durante la configuración del 2026-10-26. La API debe usar el schema/migraciones
requeridos por el código actual; ese health check no los verifica. El historial
remoto de Supabase sigue sin verificar por el agente: ver
[el estado de migraciones](../../../docs/mobile-current-state.md#primer-paso-al-retomar-verificar-supabase). Una compilación exitosa no verifica los flujos autenticados del backend.

## Generar una APK

Desde la raíz del monorepo:

```bash
pnpm install
pnpm mobile:check-types
pnpm mobile:apk
```

El primer build puede solicitar iniciar sesión en Expo y generar un Android
Keystore. EAS puede generar y administrar esa clave de firma. Las siguientes
versiones deben conservar la misma clave para poder instalarse como actualización.
No subir keystores ni `credentials.json` al repositorio.

Equivalente desde `apps/mobile`:

```bash
pnpm dlx eas-cli@25.3.0 login
pnpm dlx eas-cli@25.3.0 build --platform android --profile preview
```

Para lanzar el build y consultar el resultado después, agregar `--no-wait`.
El historial y los enlaces de instalación están en
[los builds de Servicienta](https://expo.dev/accounts/reivajj/projects/servicienta/builds).
EAS Build compila en la nube; no es necesario instalar Android Studio localmente.
La disponibilidad y cola dependen de la cuenta de Expo.

## Instalar y compartir

1. Abrir el build completado en Expo y copiar el enlace de instalación/descarga.
2. Enviar ese enlace a la persona que va a probar la app.
3. Abrirlo desde Android, descargar la APK y permitir la instalación desde el
   navegador o aplicación usada para descargarla cuando Android lo solicite.
4. Iniciar Servicienta e ingresar con una cuenta válida de cliente o técnico.

Compartir la APK no crea usuarios. Probar login, pedidos, visitas, chat y mapas
desde datos móviles para confirmar que no depende de tu Wi-Fi. Mantener las cuentas
y los datos de prueba acordados para quienes la instalen.

## Referencias

- [Distribución interna](https://docs.expo.dev/build/internal-distribution/).
- [APKs con EAS Build](https://docs.expo.dev/build-reference/apk/).
- [EAS en monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/).
- [Variables de entorno](https://docs.expo.dev/eas/environment-variables/usage/).
