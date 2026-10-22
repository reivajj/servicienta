# Pasos iniciales para crear la app móvil de Servicienta

_Última actualización: 2026-10-12_

## Objetivo

Crear una app móvil con Expo, inicialmente enfocada en el trabajo diario del
técnico. Debe convivir con `apps/web`, usar el mismo API Gateway y reutilizar los
contratos y hooks compartidos del monorepo.

Este documento es un roadmap inicial. No define todavía el diseño visual final,
los plazos ni todas las capacidades del producto. La inspiración de UX está en
[mobile-technician-app-reference.md](./mobile-technician-app-reference.md).

## Decisiones iniciales recomendadas

- Crear `apps/mobile` dentro del monorepo actual.
- Usar Expo + React Native + TypeScript.
- Usar Expo Router para navegación basada en archivos, tabs, stacks y deep
  links. Expo lo recomienda para aplicaciones nuevas.
- Empezar por Android, sin bloquear compatibilidad futura con iOS.
- Mantener `apps/api-gateway` como entrada para operaciones de negocio.
- Usar Supabase directamente desde mobile solo para Auth y Realtime, siguiendo
  la misma frontera arquitectónica que la web.
- Reutilizar `packages/types`, `packages/api-client`, `packages/query-hooks` y,
  después de adaptarlo, `packages/supabase`.
- Empezar con un MVP para `technician`. Cliente y admin pueden incorporarse
  después de validar navegación, autenticación y distribución.
- Usar Expo Go solo al principio. Pasar a un development build cuando aparezcan
  integraciones nativas o sea necesario probar una app más cercana a producción.

Flujo de datos esperado:

```text
apps/mobile
  → packages/query-hooks
  → packages/api-client
  → apps/api-gateway
  → Supabase

apps/mobile
  → packages/supabase
  → Supabase Auth / Realtime
```

## Referencia recuperada de `spense-tracker`

El boceto `/home/reivaj/spense-tracker` confirma una estructura que puede servir
como punto de partida conceptual:

- app Expo ubicada en `apps/mobile` dentro de un workspace pnpm;
- configuración de Metro para observar el monorepo y resolver una única copia de
  React, React Native y TanStack Query;
- `AsyncStorage` para persistir la sesión de Supabase;
- `QueryClientProvider` y providers compartidos en la raíz;
- `SafeAreaProvider`, status bar y navegación inferior;
- variables `EXPO_PUBLIC_*` para configuración pública de runtime;
- EAS con perfiles `preview` y `production`;
- APK interno para pruebas y AAB para Play Store.

No conviene copiar su capa de datos literalmente. Spense consume Supabase como
backend principal; Servicienta contiene reglas de negocio y autorización en el
API Gateway.

## Fase 0 — Preparar el terreno

Antes de construir pantallas:

1. Validar el flujo web prioritario de técnico:
   - iniciar sesión;
   - ver y aceptar pedidos;
   - abrir el chat;
   - agendar una visita;
   - completar o cancelar la visita.
2. Resolver fallos críticos confirmados en ese recorrido.
3. Definir las URLs de gateway y Supabase para desarrollo, preview y producción.
4. Confirmar que el gateway es accesible por HTTPS desde un dispositivo físico.
5. Definir un identificador estable para la app, por ejemplo
   `com.servicienta.mobile`, antes de publicar builds.

Al probar contra un servidor local, `localhost` en el teléfono apunta al propio
teléfono. Será necesario usar una URL accesible en la red local, un túnel seguro
o un entorno remoto de desarrollo.

## Fase 1 — Crear el workspace móvil

1. Generar una aplicación Expo nueva con Expo Router dentro de `apps/mobile`.
2. Alinear sus versiones de React, TypeScript y TanStack Query con el monorepo.
3. Agregar scripts raíz, como:
   - `mobile:start`;
   - `mobile:android`;
   - `mobile:check-types`;
   - `mobile:build:preview`;
   - `mobile:build:production`.
4. Agregar el workspace a las tareas de Turborepo.
5. Confirmar que Metro resuelve correctamente los packages compartidos.
6. Ejecutar una pantalla mínima en un teléfono Android y en un emulador.

Expo tiene soporte para monorepos con pnpm y, en versiones actuales, configura
automáticamente gran parte de Metro. Solo se debería agregar configuración
manual si aparece un problema real de resolución o duplicación de dependencias.

### Estructura inicial sugerida

```text
apps/mobile/
  app/
    _layout.tsx
    (auth)/
      sign-in.tsx
    (technician)/
      _layout.tsx
      today.tsx
      orders.tsx
      visits.tsx
      chats.tsx
      profile.tsx
    orders/[orderId].tsx
    operations/[operationId].tsx
    chats/[orderId].tsx
  src/
    components/
    features/
    lib/
      env.ts
      supabase.ts
      api-client.ts
    theme/
  assets/
  app.config.ts
  eas.json
  package.json
```

`app/` debería contener rutas y layouts delgados. Los componentes, casos de UI y
adaptadores de infraestructura deberían vivir en `src/`.

## Fase 2 — Infraestructura compartida

### Variables de entorno

Preparar, como mínimo:

```text
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Las variables `EXPO_PUBLIC_*` quedan incluidas en el bundle y no son secretas.
Nunca colocar allí `SUPABASE_SERVICE_ROLE_KEY`, claves privadas ni credenciales
administrativas.

Configurar ambientes separados en EAS:

- `development`;
- `preview`;
- `production`.

### Supabase Auth

Crear o extender un helper móvil en `packages/supabase` que permita:

- storage compatible con React Native;
- `persistSession: true`;
- `autoRefreshToken: true`;
- `detectSessionInUrl: false` en native;
- control de auto-refresh según el estado foreground/background de la app.

La documentación actual de Supabase muestra `AsyncStorage` como alternativa y
también una opción basada en el polyfill de `expo-sqlite`. Elegir una sola tras
probar persistencia, logout y actualización del token en Android.

### API Gateway

Construir el `ApiClient` móvil con:

- `EXPO_PUBLIC_API_URL` como `baseUrl`;
- `getAccessToken()` leyendo la sesión vigente de Supabase;
- el mismo `ApiClientProvider` usado por `packages/query-hooks`.

El cliente compartido ya acepta un proveedor async de token, por lo que no se
necesita duplicar fetchers ni contratos.

### Providers raíz

El layout raíz debería componer, al menos:

1. safe areas;
2. sesión/autenticación;
3. `QueryClientProvider`;
4. `ApiClientProvider`;
5. tema;
6. navegación según sesión y rol.

## Fase 3 — Primer vertical slice

Construir una prueba end-to-end pequeña antes de toda la navegación definitiva:

1. Login de técnico.
2. Obtener `current user` desde el gateway.
3. Mostrar pedidos actuales.
4. Abrir el detalle de un pedido.
5. Aceptarlo.
6. Abrir automáticamente el chat asociado.
7. Enviar y recibir un mensaje.
8. Cerrar y volver a abrir la app comprobando que la sesión persiste.

Este corte valida Expo, sesión, token, gateway, packages compartidos, React
Query, navegación y Realtime con muy poca UI descartable.

## Fase 4 — MVP del técnico

### Navegación sugerida

- `Hoy`: agenda del día, pedidos nuevos y próxima visita.
- `Pedidos`: solicitudes pendientes y aceptadas.
- `Visitas`: pendientes, agendadas e historial.
- `Chats`: conversaciones y mensajes no leídos.
- `Perfil`: disponibilidad, zonas, especialidades y cierre de sesión.

### Capacidades mínimas

- autenticación y restauración de sesión;
- protección de rutas por sesión y rol;
- listado y detalle de pedidos;
- aceptar o rechazar pedidos;
- chat por pedido;
- agendar, reprogramar y cancelar visitas según reglas del backend;
- marcar trabajo terminado;
- agenda diaria y calendario básico;
- perfil y oferta técnica;
- estados de carga, vacío, error, reintento y falta de conexión;
- pull-to-refresh donde aporte valor;
- indicadores de mensajes no leídos.

No incluir todavía pagos, rendiciones, taller, reclamos o adjuntos salvo que el
flujo operativo básico ya esté validado y se hayan definido sus reglas.

## Fase 5 — Experiencia móvil y resiliencia

Después del vertical slice:

1. Diseñar componentes táctiles compartidos: botones, tarjetas, chips, campos,
   loaders, errores y hojas inferiores.
2. Aplicar la referencia visual documentada sin copiar su modelo de negocio.
3. Mantener las acciones principales accesibles en pantallas largas.
4. Probar conectividad lenta, pérdida de red y reintentos.
5. Evitar actualizaciones optimistas para transiciones críticas hasta garantizar
   idempotencia y consistencia en backend.
6. Definir qué lecturas pueden conservarse temporalmente en caché y qué acciones
   requieren conexión.
7. Agregar deep links a pedido, visita y chat.
8. Incorporar notificaciones push después de estabilizar rutas y permisos.

El offline completo no debería formar parte del primer MVP. Una primera meta
razonable es mostrar datos cacheados, explicar que no hay conexión y reintentar
sin perder texto o formularios locales.

## Fase 6 — Calidad y seguridad

Validar como mínimo:

- usuario sin sesión;
- técnico, cliente y admin intentando entrar a rutas ajenas;
- expiración y refresh de sesión;
- acceso a pedidos, visitas y chats de otros usuarios;
- doble toque y solicitudes duplicadas;
- timezone al agendar;
- background/foreground durante un chat;
- llegada de mensajes Realtime;
- pérdida de red durante una mutación;
- cierre de sesión y limpieza de caché;
- Android pequeño, teclado abierto y accesibilidad básica;
- ausencia de secretos en bundle, logs y reportes de error.

Automatización progresiva:

- typecheck y lint por workspace;
- tests unitarios de mappers y utilidades;
- tests de hooks con API simulada;
- pruebas de componentes críticos;
- recorrido E2E del técnico en un build preview.

## Fase 7 — Builds y distribución

1. Crear el proyecto EAS y completar `projectId`.
2. Configurar un development build.
3. Configurar `preview` con distribución interna y APK Android.
4. Configurar `production` con AAB y versionado automático.
5. Definir icono, adaptive icon, splash, scheme y permisos.
6. Distribuir preview a un grupo pequeño de técnicos.
7. Corregir telemetría, crashes y problemas de dispositivos reales.
8. Crear la aplicación en Play Console.
9. Subir la primera versión a internal testing y avanzar gradualmente.
10. Evaluar iOS cuando el flujo Android sea estable.

Las actualizaciones OTA con EAS Update deberían habilitarse después de definir
una política de runtime/versiones. No todo cambio puede publicarse por OTA: los
cambios que agregan código o configuración nativa requieren un nuevo build.

## Orden recomendado de implementación

```text
Workspace Expo
  → Auth persistente
  → ApiClient + Query hooks
  → Vertical slice aceptar pedido/chat
  → Agenda y visitas
  → Perfil técnico
  → Estados offline/error
  → Development build
  → Preview con técnicos
  → Notificaciones
  → Producción Android
```

## Criterio de cierre del primer MVP

Un técnico debe poder instalar un build preview, iniciar sesión, ver sus pedidos,
aceptar uno, conversar con el cliente, agendar la visita, marcar su trabajo como
terminado y volver a abrir la app sin perder la sesión. El comportamiento debe
ser coherente con la web y con las reglas del API Gateway.

## Referencias técnicas

- [Expo: trabajar con monorepos](https://docs.expo.dev/guides/monorepos/)
- [Expo Router: introducción](https://docs.expo.dev/router/introduction/)
- [Expo: development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo: variables de entorno en EAS](https://docs.expo.dev/eas/environment-variables/usage/)
- [Expo: configuración de `eas.json`](https://docs.expo.dev/build/eas-json/)
- [Supabase Auth con React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)

Revisar nuevamente estas referencias al comenzar la implementación porque Expo,
EAS y sus versiones compatibles cambian con frecuencia.

### Cierre de visitas y reseñas en mobile

El detalle de visita permite al técnico asignado completar una visita agendada,
con confirmación previa. El cliente puede confirmar el cierre o indicar que el
trabajo sigue pendiente. Una vez confirmado, puede enviar una reseña de 1 a 5
estrellas con comentario opcional; la reseña guardada se muestra en el detalle.
El chat ofrece accesos a estas acciones por visita. Se reutilizan los endpoints
y permisos existentes del gateway y los hooks compartidos.

### Filtros mobile para técnicos

Pedidos y Visitas ofrecen una barra compacta de búsqueda, estado y fecha que
abre paneles con Aplicar y Cancelar. Los filtros se combinan y pueden limpiarse.
El texto busca en nota, nombre y apellido del cliente, zona y artefacto en
ambos listados. Pedidos conserva la búsqueda por dirección. En Visitas incluye
la nota técnica y la nota del pedido. La fecha corresponde a `created_at` en
Pedidos y a `scheduled_at` en Visitas.
Los accesos rápidos incluyen Hoy, Mañana, 7 días (hoy y los seis días siguientes) y 30 días
(hoy y los 29 días siguientes), con días de Argentina. También se puede elegir un día o rango, incluyendo
fechas pasadas. Las visitas sin agenda no aparecen al seleccionar una fecha.

La API admite `date_from` y `date_to` como días inclusivos `YYYY-MM-DD`.
La lista, el total y los contadores por estado usan los mismos filtros; si se
elige un estado, los contadores de otros estados quedan en cero. Las listas
mobile se paginan de a 25 resultados, sin limitar los contadores a esa página.

Validación de fechas y contadores: `node --import tsx scripts/tests/list-filters.test.mts`.


### Accesos técnicos a Completar visita

El técnico puede iniciar el mismo pop-up de confirmación desde el OK del chat,
la card de HOY, la card explicativa del detalle o el botón fijo del detalle.
El estado encabeza la barra de acciones del chat; calendario y OK tienen el
mismo tamaño, y el OK solo aparece para visitas agendadas. En el detalle,
CHAT y PEDIDO comparten la primera fila fija, con Completar visita debajo.
El pop-up explica que el cliente podrá confirmar el trabajo y dejar una reseña,
permite volver atrás y evita reenvíos mientras se guarda. En HOY, tocar el OK
abre la confirmación directamente sin navegar al detalle. Al confirmar, se
actualizan el chat, los pedidos, las visitas y la agenda mediante los hooks
existentes. No requiere cambios de base de datos.
