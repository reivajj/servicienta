# Ejecutar Expo y probar la app móvil

Todos los comandos se ejecutan desde la raíz del monorepo, salvo que se indique
lo contrario.

## Estado actual antes de probar

Leer [Mobile: estado actual y cómo retomar](../../../docs/mobile-current-state.md).
Contiene las migraciones necesarias para búsqueda y agenda de pedidos, los
flujos implementados y el recorrido de QA pendiente. Para el login del CLI y
la aplicación de migraciones, consultar [Supabase workflow](../../../docs/supabase-workflow.md).

## SDK actual: Expo 58

Actualizado el 2026-10-26 a Expo `58.0.19`, React Native `0.88.0` y React
`19.3.0`, con las versiones compatibles de Router, Reanimated, Worklets,
DateTimePicker, Safe Area y Screens. Se alineó React en web/query-hooks para no
instalar otro runtime dentro de mobile.

Usar Node 22.13+ de la rama 22, 24.3+ de la rama 24 o 26+ (el entorno validado
usa 22.22.2). No ejecutar Expo con Node 18/20 o las ramas 23/25.

Después de esta actualización, detener cualquier Metro/Expo anterior con
`Ctrl+C` y arrancar nuevamente desde la raíz:

```bash
pnpm mobile:start:clear
```

Abrir el QR con una versión de Expo Go compatible con SDK 58. Si el teléfono
sigue indicando incompatibilidad, comprobar el SDK que admite su Expo Go;
[las versiones del proyecto y de Expo Go deben coincidir](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/).
En Android se puede obtener una versión compatible desde [expo.dev/go](https://expo.dev/go).
La prueba en teléfono queda pendiente: exportar bundles no instala la app ni
comprueba el Expo Go del dispositivo.

Validación de la actualización: Expo Doctor 20/20, tipos de mobile/query-hooks,
bundles de Android/iOS/web y build de web. Se mantuvo Metro configurado para el
monorepo. Se retiró `newArchEnabled`, que SDK 58 ya no acepta, y se agregaron los
plugins/dependencias nativas detectados por Expo CLI/Doctor (`expo-font`,
DateTimePicker y StatusBar). Las refs de React Native usan los tipos de instancia
nuevos (`ScrollViewInstance`, `TextInputInstance`).

Referencias: [actualizar SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/),
[SDK 58](https://expo.dev/changelog/sdk-58),
[migración de Router](https://docs.expo.dev/router/migrate/sdk-57-to-58/).

## Preparación inicial

Instalar las dependencias con la versión de pnpm indicada en el `package.json`
raíz:

```bash
pnpm install
```

Si todavía no existe `apps/mobile/.env`, crearlo a partir del ejemplo:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Completar las tres variables:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:4000
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

La IP es ilustrativa: reemplazarla por la de la computadora en la red local o
por la URL del gateway remoto. En un teléfono físico, `localhost` apunta al
propio teléfono. En el emulador estándar de Android, `10.0.2.2` permite llegar
al host; por ejemplo, `http://10.0.2.2:4000`.

Estas variables son públicas y se incluyen en el bundle. Usar la clave pública
de Supabase, nunca la `service_role`. Reiniciar Expo después de cambiar `.env`.

## Iniciar el API Gateway

Si se usa un gateway local, configurar primero `apps/api-gateway/.env.local`
según `apps/api-gateway/.env.example` y ejecutar en otra terminal:

```bash
pnpm --filter @servicienta/api-gateway dev
```

El puerto predeterminado es `4000`; si se configura `PORT`, ajustar también
`EXPO_PUBLIC_API_URL`. Mantener esta terminal abierta durante las pruebas.
Si se utiliza un gateway remoto, este paso no es necesario.

## Comandos de Expo

| Comando | Uso |
| --- | --- |
| `pnpm mobile:start` | Iniciar el servidor de desarrollo y mostrar el QR. |
| `pnpm mobile:start:clear` | Iniciar en red local y limpiar la caché de Metro. |
| `pnpm mobile:start:tunnel` | Iniciar con túnel y limpiar la caché. Requiere Internet y puede solicitar instalar `@expo/ngrok`. |
| `pnpm mobile:android` | Iniciar Expo e intentar abrir Android en un emulador o dispositivo conectado. |
| `pnpm --filter @servicienta/mobile ios` | Intentar abrir el simulador iOS; requiere macOS y Xcode. |
| `pnpm --filter @servicienta/mobile web` | Abrir la versión web para una revisión rápida de la interfaz. |
| `pnpm mobile:check-types` | Verificar TypeScript sin generar un APK. |

En la terminal de Expo, `a` abre Android, `r` recarga la app y `Ctrl+C` detiene
el servidor. Si Expo ofrece seleccionar el destino, usar Expo Go para estas
pruebas iniciales. La versión instalada de Expo Go debe ser compatible con el
SDK declarado en `apps/mobile/package.json`; si no lo es, se necesita una
versión compatible o un development build.

## Probar en un teléfono Android

1. Conectar teléfono y computadora a la misma red Wi-Fi.
2. Iniciar el gateway si se usa uno local.
3. Ejecutar `pnpm mobile:start:clear`.
4. Abrir Expo Go y escanear el QR.
5. Ingresar con una cuenta existente de rol `technician`.

Si la red impide conectarse a Metro, probar `pnpm mobile:start:tunnel`.
El túnel de Expo sirve el código de la app: **no publica el gateway local**.
`EXPO_PUBLIC_API_URL` debe seguir siendo accesible desde el teléfono.

## Probar en un emulador Android

Crear e iniciar un dispositivo virtual desde Android Studio y ejecutar:

```bash
pnpm mobile:android
```

Para un gateway en la computadora, configurar la URL con `10.0.2.2` como se
indica arriba. El comando inicia el servidor de desarrollo; no genera un APK
de distribución.

## Recorrido manual: pedido → aceptación → chat

Preparar una cuenta técnica con un pedido `pending` asignado y una cuenta
cliente para comprobar la conversación desde la web.

1. Iniciar sesión como técnico y entrar a **Pedidos**.
2. Tocar una tarjeta y verificar cliente, equipo, problema, dirección y estado.
3. Pulsar **Aceptar y abrir chat**. Mientras procesa, la acción debe quedar
   deshabilitada.
4. Verificar que se abre el chat al confirmarse la aceptación.
5. Enviar un mensaje y responder desde la cuenta cliente; comprobar la llegada
   por Realtime.
6. Volver al detalle: el pedido debe estar aceptado y ofrecer **Abrir chat**.
7. Revisar **Visitas** para comprobar la visita creada por el gateway.
8. Cerrar y volver a abrir la app para verificar la restauración de sesión.

Comprobar también que un fallo de carga permite reintentar y que una aceptación
fallida muestra el error. Un pedido cancelado no debe ofrecer aceptación.

## Problemas frecuentes

- **El QR no conecta:** comprobar Wi-Fi, permisos de red y firewall; probar el
  túnel para Metro.
- **Después de cambiar de red o reiniciar el router:** la IP local puede cambiar.
  En Linux, consultar `hostname -I`, actualizar `EXPO_PUBLIC_API_URL` en
  `apps/mobile/.env` y reiniciar Expo. Para evitar cambios frecuentes, se puede
  reservar una IP para la computadora en el router.
- **La app abre, pero fallan las consultas:** verificar la URL del gateway y que
  sea accesible desde el teléfono. El túnel de Expo no resuelve este acceso.
- **Pantalla o bundle desactualizados:** detener Expo y ejecutar
  `pnpm mobile:start:clear`.
- **TypeScript no reconoce una ruta nueva:** iniciar Expo para que regenere
  `.expo/types` y volver a ejecutar `pnpm mobile:check-types`.
- **El navegador funciona, pero Android no:** repetir la prueba en dispositivo;
  la vista web no valida teclado, safe areas ni el ciclo de vida nativo.

## Documentación y distribución

`apps/mobile/docs/` contiene documentación de desarrollo y se versiona en Git.
No importarla desde el código de la app ni declararla como asset.

El archivo [`.easignore`](../../../.easignore) de la raíz excluye esta carpeta
del archivo que se carga a EAS Build y conserva las reglas de los `.gitignore`
actuales. Mantenerlo actualizado si cambian esas exclusiones.

Ya existe el perfil `preview` en `apps/mobile/eas.json` para generar APKs de
distribución interna. Desde la raíz: `pnpm mobile:apk`. La guía completa de
cuenta Expo, variables remotas, firma, instalación y distribución está en
[android-apk.md](./android-apk.md). Los comandos de inicio de esta guía siguen
siendo para desarrollo con Metro.

Referencias oficiales:

- [Expo CLI](https://docs.expo.dev/more/expo-cli/).
- [Archivos enviados a EAS Build](https://github.com/expo/fyi/blob/main/eas-build-archive.md).
- [Exclusiones con .easignore](https://docs.expo.dev/build-reference/easignore/).

## Acciones rápidas del chat

Desde un pedido aceptado o una visita, abrir su chat y pulsar el ícono de
**calendario**: abre directamente el calendario mensual para agendar o cambiar
fecha y horario. El ícono rojo sutil del extremo derecho permite cancelar con
confirmación en un popup. Si el pedido tiene varias visitas, elegir cuál se
quiere gestionar; al entrar desde el detalle de una visita, queda elegida.

Elegir el día en el calendario y elegir hora de Argentina en el reloj nativo, en
intervalos de 5 minutos, y descripción técnica. No se permiten días pasados;
la fecha y hora deben ser futuras. Los errores conservan el formulario para
corregir y reintentar.

Para probar: agendar una visita pendiente, comprobar el mensaje de acción en
ambos chats y el horario en Visitas/Hoy; reprogramarla y verificar el cambio.
Probar cancelación solo sobre una visita de prueba: es irrevocable.

Prueba de validación de horarios (Node 22; el package de tipos exporta su
entrada de runtime mediante la condición `import`):

```bash
TSX_TSCONFIG_PATH=tsconfig.scripts.json node --conditions=import --import tsx --test scripts/seeds/mobile/chat-schedule.test.ts
```

En Android, tocar la hora abre el reloj del sistema; en iOS, el selector de
ruedas. Para probarlos desde la computadora, usar un emulador Android con
`pnpm mobile:android` (o el simulador iOS en macOS). En navegador,
`pnpm --filter @servicienta/mobile web` usa el selector horario del navegador,
con paso de 5 minutos; la validación también comprueba ese intervalo al guardar.

## Perfil: disponibilidad y oferta técnica

En **Perfil**, el técnico puede editar disponibilidad, localidades/barrios y
los electrodomésticos que atiende. Cada electrodoméstico permite atender todas
las marcas o seleccionar marcas concretas, igual que en web.

Los cambios se aplican al pulsar **Guardar oferta**; el spinner aparece dentro
del botón. Si falla la solicitud, las selecciones se conservan para reintentar.
Al volver a la pestaña se consulta el perfil actualizado, conservando cualquier
borrador sin guardar que exista en la sesión actual.

Para probar, cambiar disponibilidad, agregar o quitar una zona y un equipo,
guardar y comprobar los mismos valores en web. Probar también un equipo con
marcas específicas: debe elegirse al menos una marca o activar **Todas las
marcas**. Volver a abrir Perfil permite comprobar la persistencia.

## Acceso de clientes

Las cuentas existentes de rol `client` y `technician` pueden iniciar sesión.
El técnico conserva **Hoy**, mientras el cliente ve **Inicio** en la primera
pestaña. Ambos mantienen **Pedidos**, **Visitas**, **Chats** y **Perfil**.

El cliente puede buscar por zona y electrodoméstico, elegir un técnico y enviar
un pedido con problema, dirección e indicaciones. Al crearlo se abre su detalle.
Las tarjetas del cliente muestran al técnico asociado; los endpoints existentes
filtran los pedidos, visitas y chats según el usuario autenticado.

Las acciones de aceptación y gestión de agenda son exclusivas del técnico.
El Perfil del cliente muestra su nombre, email y cierre de sesión; no consulta
la oferta técnica ni endpoints administrativos de perfiles de cliente.

Prueba manual: iniciar sesión con `juan-user@lopez.com.ar` o
`test-signup@test.com`, revisar las cinco pestañas, abrir un pedido y una visita,
probar el chat y buscar un técnico para crear un pedido de prueba. Después,
cerrar sesión e ingresar como técnico para comprobar que vuelve **Hoy** y que
se conserva la edición de su oferta en Perfil.


### Inicio del cliente: visita programada y búsqueda

La pantalla Inicio destaca la próxima visita `scheduled` desde hoy en Argentina,
con técnico, estado y fecha/horario. Si hay varias, ofrece un enlace al listado.
La búsqueda para solicitar otro servicio queda debajo. Si no hay visitas, aparece
la búsqueda; un fallo de agenda permite reintentar sin bloquearla.

Probar con una cuenta cliente con visita hoy y otra futura, abrir el detalle desde
la card y usar pull-to-refresh después de agendar o completar desde el técnico.
Comprobar también el caso sin visitas y que una visita de hoy con hora pasada se
mantiene destacada hasta cambiar su estado o pasar el día.
