# Mobile: estado actual y cómo retomar

_Última actualización: 2026-10-26. Flujo cliente/técnico, rechazo con motivo, ajustes web y configuración del APK interno._

Este documento describe el código implementado en `apps/mobile` y los cambios
compartidos que necesita. Es el punto de entrada para retomar el trabajo;
[el roadmap](./mobile-app-roadmap.md) conserva el plan original y notas de
implementación. El dominio general sigue en [source-of-truth.md](./source-of-truth.md).

## Primer paso al retomar: verificar Supabase

La última verificación del historial remoto se intentó el **2026-10-26**.

**Antes de retomar, verificar que el Supabase usado por el gateway tenga las
migraciones de búsqueda, agenda de pedidos y rechazo con motivo.** El agente no
las aplicó al remoto. La consulta del historial falló con `Access token not provided`;
no se constató si fueron aplicadas por otra vía. La respuesta de `/health` del
gateway no comprueba el schema ni los flujos autenticados.

Revisar estas migraciones, en orden:

| Migración | Para qué se usa | Estado conocido al cierre |
| --- | --- | --- |
| [202610220001_add_order_operation_search_fields.sql](../supabase/migrations/202610220001_add_order_operation_search_fields.sql) | Búsqueda por notas, cliente, zona y artefacto. | Existe en el repo; aplicación remota sin verificar en esta sesión. |
| [202610220002_add_order_worklist_fields.sql](../supabase/migrations/202610220002_add_order_worklist_fields.sql) | Clasificación operativa de pedidos y orden por visita asociada. | Existe en el repo; aplicación remota sin verificar por el agente. |
| [202610260001_reject_visit_completion_with_reason.sql](../supabase/migrations/202610260001_reject_visit_completion_with_reason.sql) | Motivo de rechazo de visita y evento del chat en una transacción. | Probada localmente; no aplicada al remoto por el agente. |

Las dos primeras agregan funciones calculadas PostgREST, sin tablas ni columnas nuevas.
Usan `STABLE SECURITY INVOKER`, `search_path` vacío y ejecución solo para
`service_role`. Las consultas del gateway mantienen los filtros de pertenencia.
Las rutas nuevas de búsqueda/agenda necesitan esas funciones en el mismo
proyecto Supabase al que apunta el gateway.

Desde la raíz del repo:

```bash
pnpm exec supabase login
pnpm exec supabase projects list
pnpm exec supabase link --project-ref owplnnduqiicvftihaug
pnpm exec supabase migration list --linked
```

Confirmar proyecto y revisar todos los SQL pendientes antes de aplicar:

```bash
pnpm exec supabase migration up --linked
pnpm exec supabase migration list --linked
```

El procedimiento completo de login, token, contraseña PostgreSQL y problemas
frecuentes está en [supabase-workflow.md](./supabase-workflow.md), enlazado también
desde [supabase/README.md](../supabase/README.md). No guardar credenciales en estos
documentos.

## Rechazo de finalización con motivo (2026-10-26)

El cliente abre un diálogo desde “El trabajo no está terminado”, escribe un motivo
obligatorio (máximo 2000 caracteres) y pulsa “Confirmar rechazo y enviar mensaje”.
“Atrás” no modifica la visita ni envía nada. El motivo queda visible en el detalle
para ambos roles y en el chat como evento escrito por el cliente. Web utiliza el
mismo contrato y también solicita motivo y confirmación.

**Verificar que esté aplicada
[202610260001_reject_visit_completion_with_reason.sql](../supabase/migrations/202610260001_reject_visit_completion_with_reason.sql).
Se probó en PostgreSQL descartable; no fue aplicada ni verificada por el agente en remoto.**
Las consultas de visitas ahora incluyen los nuevos campos, por lo que necesitan
esta migración, incluso para listar. No se verificó el historial remoto por falta
de token de acceso del CLI en esta sesión.

`operations.completion_rejection_reason` y `completion_rejected_at` son campos
propios: la descripción técnica se conserva. La RPC del gateway guarda estado de
visita/pedido, motivo, evento del chat y auditoría en una transacción. Reintentos
idénticos no duplican mensajes. Ver [supabase-rpcs.md](./supabase-rpcs.md#reject_operation_completion).

## Actualización de runtime a SDK 58 (2026-10-26)

Mobile está en Expo `58.0.19`, React Native `0.88.0`, React/React DOM `19.3.0`.
Se actualizaron las dependencias nativas con Expo CLI y se alineó React en web y
query-hooks para eliminar la copia adicional detectada en mobile. Metro usa
`@react-native/metro-config@0.88.0`. Se corrigieron refs de instancia, tipos de
color para iconos y los componentes opcionales de listas (`undefined` en vez de
`null`) exigidos por la nueva API estricta de React Native.

`newArchEnabled` se eliminó del config por incompatibilidad con el schema nuevo.
Expo CLI agregó plugins para DateTimePicker, StatusBar y fuentes. Se declararon
`expo-font`, `@expo/dom-webview` y `@expo/metro-runtime` compatibles con SDK 58.
El lockfile forma parte de esta actualización.

Validaciones: Expo Doctor 20/20, tipos mobile/query-hooks, build web y exportación
de bundles Android/iOS/web. Esas exportaciones no compilan una APK/IPA ni prueban
la interacción en el celular; el build nativo de EAS se registra por separado abajo. Para retomar, detener el Expo previo y ejecutar `pnpm mobile:start:clear`;
Expo Go del teléfono debe admitir SDK 58. Detalles y versiones de Node en
[la guía de Expo](../apps/mobile/docs/expo-development.md#sdk-actual-expo-58).

## APK Android para pruebas internas

Proyecto EAS vinculado: [@reivajj/servicienta](https://expo.dev/accounts/reivajj/projects/servicienta).
El perfil `preview` genera APKs firmadas de distribución interna; usa las variables
del entorno EAS `preview` y la API pública `https://servicienta-api.vercel.app`.
Se configuraron validación de variables y compilación de `@servicienta/types`
en los hooks de EAS. No depende de Metro ni del `.env` con la IP de desarrollo.

Desde la raíz: `pnpm mobile:apk`. Ver [la guía de APK](../apps/mobile/docs/android-apk.md)
para firma, descarga, instalación y próximas compilaciones. El estado de un build
se consulta en Expo; esta configuración no publica en Google Play.

Primer build: [a71e8e83-1f38-4e76-b92f-3c9aa328770d](https://expo.dev/accounts/reivajj/projects/servicienta/builds/a71e8e83-1f38-4e76-b92f-3c9aa328770d).
Última consulta el **2026-10-26**: `IN_QUEUE`, sin artefacto disponible aún.
Se creó el keystore en EAS y se inicializó la versión nativa remota (versionCode 2).
Las tres variables públicas están cargadas en `preview`; el `.env` de desarrollo
conserva su configuración local. Falta que finalice el build e instalar/probar la
APK en Android fuera de la red local. No se configuró EAS Update ni distribución iOS.

## Base de la app

- Expo + React Native + Expo Router, con configuración en `apps/mobile/app.json`.
- Sesión persistente de Supabase y protección de rutas con `MobileAccess`.
- Negocio a través de `query-hooks → api-client → api-gateway → Supabase`.
- Supabase directo desde mobile para Auth y Realtime del chat.
- Roles `technician` y `client`. El grupo de rutas `(technician)` contiene tabs
  compartidas; para cliente la primera pestaña es Inicio y para técnico es Hoy.
- El técnico tiene Hoy, Pedidos, Visitas, Chats y Perfil. El cliente también
  puede buscar técnicos, crear pedidos y confirmar/reseñar visitas.
- Configuración pública en `apps/mobile/.env`: `EXPO_PUBLIC_API_URL`,
  `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

La guía para levantar gateway/Expo, usar QR, túnel o emulador está en
[expo-development.md](../apps/mobile/docs/expo-development.md). El túnel de Expo
no publica el API Gateway: su URL debe ser accesible desde el teléfono.

## Comportamiento acordado de las pantallas

### Inicio del cliente

Desde el 2026-10-26 la primera pestaña del cliente es Inicio (icono de casa).
`ClientHomeScreen` reutiliza `useCurrentScheduledOperations` y encabeza la misma
pantalla de búsqueda con una visita destacada. Se consideran `scheduled` desde
el inicio de hoy en Argentina; una visita de hoy sigue visible aunque su hora
haya pasado. Las de días anteriores, canceladas o terminadas no se destacan.

Si hay varias, se muestra la más próxima y un enlace con la cantidad al listado
de visitas. La card reutiliza `OperationCard`: nombre del técnico, estado,
fecha/horario, equipo, dirección y acceso al detalle. El cliente no recibe el OK
de cierre técnico. Debajo sigue la búsqueda de técnicos y creación de otro pedido.
Sin visitas, queda la búsqueda como contenido principal. Un error al consultar
visitas muestra Reintentar y no bloquea la búsqueda.

Se refresca al recuperar foco y con pull-to-refresh; el día de referencia se
actualiza cada minuto. La lectura de visitas carga todas las páginas. Este cambio
no agrega endpoints ni requiere una migración nueva; reutiliza el listado actual
que autoriza las visitas del cliente.

Archivos: `apps/mobile/src/features/home/ClientHomeScreen.tsx`, `home/visits.ts`,
`search/TechnicianSearchScreen.tsx` (cabecera y refresh opcionales), y las rutas
`app/(technician)/today.tsx` y `_layout.tsx`.

Validado con tipos, tres pruebas de selección de visita y exportación web de Expo.
Pendiente de prueba en celular con agenda/cliente reales. Pruebas:
`node --import tsx scripts/tests/client-home-visits.test.mts`.

### VISITAS del cliente

`OperationsScreen` selecciona una pantalla específica para cliente:
`ClientVisitsScreen`. La vista inicial muestra solo la visita pendiente más
reciente de hoy o de días anteriores, destacada, junto con las próximas visitas.
Las pendientes anteriores y las finalizadas quedan ocultas hasta pulsar el badge
Historial con contador. Al activarlo se muestran únicamente esas visitas
anteriores, sin repetir la destacada ni las próximas. Se puede desactivar el
badge o usar Volver a mis visitas. Las acciones de completar/opinar también se
conservan dentro del historial cuando corresponden. Una visita confirmada por
el cliente sin reseña sigue pendiente de opinión.

La descripción de las cards del cliente se reemplaza por orientación según su
estado; el detalle conserva la nota técnica completa. Para una agendada de hoy:
“Tu visita está programada para hoy. Cuando el técnico la marque como terminada,
podrás confirmar el trabajo y dejar tu opinión.” Para fechas pasadas se explica
que todavía se espera el cierre técnico y se menciona el chat.

En `completed_tech`, el mensaje se destaca en verde y aparece Completar visita y
opinar. En `completed` sin review aparece Dejar mi opinión. No se permite
confirmar ni reseñar mientras siga `scheduled`. Ambos botones abren el detalle
con `focusCompletion=true`, desplazándolo a la card de confirmación/reseña.
La confirmación conserva los metadatos cacheados para mostrar a continuación
el formulario de opinión sin perder identidad/contacto.

`useCurrentClientVisits` consulta todas las páginas autorizadas del cliente para
que la visita pendiente más reciente no quede oculta por la paginación anterior.
El orden/agrupación y los textos están en `operations/client-visits.ts`. Se
refresca al recuperar foco y con pull-to-refresh; cambia el día de referencia
cada minuto. Este tramo no modifica base, contratos HTTP ni permisos. Evaluar
paginación más específica si crece mucho el historial del cliente.

Pruebas: `node --import tsx scripts/tests/client-visit-attention.test.mts` (5 casos:
clasificación, habilitación de acciones por estado, día argentino y colección
mayor que una página). Pasaron tipos de mobile/query-hooks y exportación web de
Expo. Falta validar el recorrido y el desplazamiento automático en celular.

### PEDIDOS del cliente

La vista inicial muestra todos los pedidos activos con fecha de hoy o futura,
ordenados por fecha/hora ascendente (más cercano primero). Los de hoy permanecen
visibles aunque su horario ya haya pasado. Se usa `next_visit_at` si está
informado; en el listado actual del cliente se muestra la fecha de creación.
El corte de día usa Argentina. El badge Historial con contador abre los pedidos
anteriores, completados y cancelados, sin duplicar los visibles. El historial va
del más reciente al más antiguo y conserva el acceso al detalle. Se puede volver
pulsando el badge o Volver a mis pedidos.

Se implementa en `orders/ClientOrdersScreen.tsx` y `orders/client-orders.ts`.
`useCurrentClientOrders` carga todas las páginas autorizadas antes de separar
los vigentes y el historial. Refresca al recuperar foco y con pull-to-refresh; las
mutaciones existentes invalidan su query bajo `orderKeys.current()`.
No modifica los filtros ni las bandejas del técnico y no requiere migraciones.

Pruebas: `node --import tsx scripts/tests/client-order-history.test.mts` (4 casos:
pedido activo/historial, colecciones vacías o terminales y más de una página).

### HOY

Solo muestra las visitas `scheduled` del día argentino, en orden de fecha/hora.
Carga todas las páginas necesarias para no recortar la agenda a los primeros
100 registros. Tiene pull-to-refresh y actualiza la referencia de día mientras
la pantalla está activa.

Las cards muestran horario destacado, nombre, badge de estado, equipo y
dirección con iconos. No muestran fecha ni nota. El OK va a la derecha del
badge, con el mismo alto visible; abre el pop-up directamente sin navegar al
detalle. En HOY se permite este acceso para cualquier visita agendada del día,
incluso antes de su horario.

### VISITAS del técnico

La consulta móvil usa `view=main`. Mantiene las visitas agendadas de hoy y
futuras, y las pendientes; excluye únicamente las `scheduled` con fecha anterior
a hoy. Otros estados siguen siendo consultables en la vista principal.

Debajo de los filtros hay dos accesos:

| Acceso | Regla |
| --- | --- |
| Pendientes + contador | Estado `pending`, tono warning suave. Por fecha agendada si existe; sin fecha, por antigüedad de creación. |
| Sin completar + contador | Estado `scheduled` y `scheduled_at` anterior al inicio de hoy en Argentina. Incluye ayer y días anteriores. |

El corte es por **día calendario argentino**, no por 24 horas transcurridas. Una
visita de hoy con horario pasado continúa en la principal. Al cambiar el día,
si sigue agendada pasa a Sin completar.

En las cards de VISITAS, el OK solo aparece para el técnico asignado si el
estado es `scheduled` y ya se alcanzó la fecha/hora agendada. Abre la misma
confirmación que HOY sin abrir el detalle. La pantalla actualiza la hora de
referencia cada minuto mientras tiene foco.

El orden se aplica en el gateway antes de paginar: `scheduled_at` ascendente,
fechas nulas al final, desempate por creación e id en el listado técnico. El
chat también ordena las visitas por fecha/hora.

### PEDIDOS del técnico

La vista inicial usa `view=main`: activos y pendientes de aceptar, excluyendo
los casos de atención y los terminales. Ordena primero por la próxima visita
agendada desde hoy; después aparecen los pedidos sin fecha, por antigüedad de
creación. No se usa la fecha de creación como sustituto de una cita agendada.

| Acceso debajo de filtros | Regla |
| --- | --- |
| Pendientes de aceptar + contador | Pedido `pending`, con warning suave. |
| Sin completar / En espera + contador | Pedido `completed_tech` o `completion_rejected`, o con una visita asignada al técnico que siga `scheduled` en un día anterior a hoy. |
| Historial + contador | Pedido `completed` o `cancelled`, por fecha de creación descendente. |

El usuario confirmó esos casos de atención: **aceptados sin agenda permanecen
en la principal**. Una visita agendada vencida coloca el pedido en atención
aunque tenga otra visita futura. Los terminales tienen prioridad y van siempre
al historial.

La API devuelve `next_visit_at` opcional en las listas operativas. Calcula la
fecha agendada más próxima desde hoy, o la última agendada vencida si no hay
una actual/futura. Las cards identifican si la fecha mostrada corresponde a
visita agendada o creación. El calendario filtra la fecha de visita en vistas
operativas; en Historial filtra creación. Sin `view`, y para las consultas del
cliente, se mantiene el comportamiento original de listado completo.

### Filtros, contadores y presentación compartida

- Buscar, Estado y Fecha abren paneles con Aplicar filtros y Atrás. Se corrigió
  el manejo del teclado para aplicar la búsqueda con el primer toque.
- La búsqueda combina nota, nombre y apellido del cliente, zona y artefacto.
  Pedidos conserva dirección; Visitas también incluye la nota del pedido.
  Cada palabra puede estar en un campo distinto y en cualquier orden.
- No distingue mayúsculas, pero no implementa búsqueda aproximada ni eliminación
  de tildes. Los comodines introducidos por el usuario se descartan.
- Fechas rápidas: Hoy, Mañana, **7 días = hoy + 6**, **30 días = hoy + 29**.
  También hay calendario de día/rango, con fechas pasadas.
- `date_from` y `date_to` son días argentinos inclusivos `YYYY-MM-DD`.
- Las listas tienen páginas de 25. Los totales y contadores por estado se
  calculan en servidor con los filtros, no sobre las cards de la página.
- Los contadores de accesos rápidos conservan búsqueda y pertenencia (y flujo
  en Pedidos), pero ignoran fecha, estado y acceso seleccionado. Al pulsar un
  acceso, se limpian fecha/estado y se conserva búsqueda: su contador coincide
  con el alcance que se va a abrir. El acceso activo puede desactivarse o usar
  Volver a la vista principal.
- Nombre y estado comparten la primera fila de las cards. Fecha y horario van
  en la misma fila, en mitades separadas, con igual tamaño e iconos alineados.
- Formato de horarios de mobile: **13:00hs**, 24 horas; también en Próxima visita,
  detalles y chat. Las fechas de agenda usan Argentina.
- En Pedidos y Visitas las notas ocupan hasta dos líneas con puntos suspensivos;
  el detalle muestra el contenido completo. En HOY no hay nota.

### Chat, detalle y cierre de visita

La barra técnica del chat muestra badge del estado a la izquierda y calendario,
OK (solo `scheduled`) y X. Los botones tienen el mismo tamaño; la X conserva
contorno rojo. Agendar/reprogramar mantiene calendario y selector de horario.

Todos los accesos técnicos a Completar visita comparten
`CompleteVisitProvider`: OK del chat, OK de HOY/VISITAS y card explicativa del
detalle. El pop-up tiene título e icono OK en la misma fila (icono a la
derecha), explicación, confirmar y Atrás. Evita doble envío, muestra errores
y mantiene el modal abierto si falla la mutación.

El detalle muestra la card explicativa de cierre al principio del contenido.
Completar visita ya no aparece en la botonera fija. Abajo quedan fijos **Pedido |
Técnico/Cliente**, según el rol, con texto e iconos y tonos ámbar/azul. La segunda
fila abre el chat con un icono sin texto, en verde. Técnico abre
`/technicians/[publicSlug]`, una ficha con
nombre, bio, valoración, verificación, disponibilidad y antigüedad pública, con
botón Atrás para regresar. Usa `usePublicTechnicianProfile`; no consulta el perfil
administrativo ni muestra dirección/contacto privados. Si no hay slug, el enlace
queda deshabilitado. Para el técnico, el segundo acceso es Cliente y abre la ficha
vinculada al pedido. Tras el cierre técnico, el cliente confirma o rechaza mediante
el diálogo con motivo obligatorio descrito arriba. Al confirmar puede enviar una
reseña de 1 a 5 estrellas con comentario opcional; luego queda visible y no se ofrece reenviar.

La dirección abre mapas en cards, detalles y cabecera del chat: `geo:` en
Android, `maps:` en iOS y Google Maps web como alternativa. El nombre del cliente
en la cabecera del chat técnico es pulsable, 20% mayor y sin subrayado. Abre
`/orders/[orderId]/client`, una ficha con los datos de contacto/domicilio de ese
pedido, reutilizando `useCurrentOrder`. **No es el perfil administrativo global
del cliente** ni abre acceso a sus otros pedidos o direcciones.

### Ficha pública del técnico desde el detalle de visita

Ruta: `apps/mobile/app/technicians/[publicSlug].tsx`. UI:
`apps/mobile/src/features/profile/PublicTechnicianScreen.tsx`.
Reutiliza el endpoint público y hook existentes; no requiere migración ni nuevos
contratos de backend. Contempla carga, error/reintento y regreso al origen.
Validación de este cambio: tipos de mobile y exportación web de Expo.

### Iconos de acciones en mobile

`apps/mobile/src/components/ActionLabel.tsx` unifica texto e icono al final del
botón, respetando su color y tipografía. Se usa para accesos de Pedido (clipboard),
visitas (calendario), chat, confirmar/completar (check), opinión (estrella),
volver (flecha), reintentar, buscar, guardar, enviar e iniciar/cerrar sesión.
Los accesos de Técnico/Cliente mantienen persona; los filtros e historial
conservan sus iconos existentes. Los botones que ya eran solo icono (p. ej. Chat
en el footer de la visita, calendario/OK/X del chat) conservan ese formato.
Los iconos decorativos no agregan lecturas duplicadas de accesibilidad. Este
cambio no modifica destinos, permisos ni lógica de las acciones.

### Presentación del detalle de visita

La card principal reutiliza `CardSchedule` del dashboard: nombre y badge de
estado en la primera fila, fecha y horario en dos mitades de la misma fila,
equipo con icono de herramienta y nota completa con icono/separador. Dirección,
zona, indicaciones y teléfono también tienen iconos. El identificador completo
de visita se conserva en los datos de referencia inferiores. La card de cierre
continúa al principio y se mantienen los accesos fijos Pedido | Técnico/Cliente
y Chat. No se recorta la descripción al abrir el detalle.

El detalle de Pedido sigue el mismo diseño: nombre y estado juntos, fecha/hora
con `CardSchedule`, equipo con herramienta, descripción completa con separador
e iconos en ubicación/zona/indicaciones/teléfono. La fecha identifica creación
(o visita si la consulta aporta `next_visit_at`), sin inventar una cita desde
la fecha de creación. El UUID se conserva en los datos de referencia inferiores;
se mantienen las reglas y botones de aceptación/apertura de chat.

### Compatibilidad de las cards con mobile web

`OperationCard` usa un contenedor `View`; los accesos al detalle, el OK técnico,
la acción de confirmar/opinar y la dirección están separados. Así se evita el
error HTML `<button> cannot contain a nested <button>`. Esta card se reutiliza en
HOY, Inicio del cliente y VISITAS. Mantener esa separación al agregar acciones;
no envolver toda la card con otro `Pressable` de rol botón.

El envío del chat muestra solo el icono, con etiqueta accesible “Enviar mensaje”,
para conservar espacio para el texto también en navegador.

### Ajustes del detalle y estados administrativos en web

En el detalle de pedidos y visitas del admin, “Cambiar estado” y “Guardar cambios”
aparecen al comienzo. El selector está asociado al mismo formulario de edición;
el guardado conserva las validaciones de datos/fechas y la auditoría existentes.
Es una mejora de acceso a permisos ya existentes, sin endpoints ni migraciones
nuevos. No sincroniza automáticamente los estados de pedido y visita al hacer
una corrección administrativa: revisar cada entidad si se necesita corregir ambas.

El estilo compartido `status-badge` usa `flex-shrink: 0` para que etiquetas largas
como “Finalización rechazada” conserven el texto dentro del contorno. La edición
sigue limitada al admin por el gateway; cliente y técnico conservan sus acciones
de negocio.

## Archivos para retomar

| Área | Archivos principales |
| --- | --- |
| Navegación/providers | `apps/mobile/app/_layout.tsx`, `app/(technician)/_layout.tsx` |
| Agenda diaria | `apps/mobile/src/features/today/TodayScreen.tsx`, `agenda.ts` |
| Visitas/cards/accesos | `apps/mobile/src/features/operations/OperationsScreen.tsx`, `VisitAttentionFilters.tsx` |
| Pedidos/cards/historial | `apps/mobile/src/features/orders/OrdersScreen.tsx`, `OrderWorklistFilters.tsx` |
| Confirmación compartida/cierre | `apps/mobile/src/features/operations/CompleteVisitProvider.tsx`, `VisitCompletion.tsx`, `OperationDetailScreen.tsx` |
| Chat/agenda | `apps/mobile/src/features/chat/ChatThreadScreen.tsx`, `ChatQuickActions.tsx`, `VisitCalendar.tsx`, `TimePickerField*` |
| Ficha cliente | `apps/mobile/app/orders/[orderId]/client.tsx`, `src/features/profile/ClientDetailScreen.tsx` |
| UI común | `apps/mobile/src/components/AddressLink.tsx`, `CardSchedule.tsx`, `StatusChip.tsx`, `src/lib/format.ts` |
| Consultas y contratos | `packages/query-hooks/src/{orders,operations}`, `packages/api-client/src/{orders,operations}`, `packages/types/src/{orders,operations}` |
| Filtros del servidor | `apps/api-gateway/src/operations/helpers/attention.ts`, `orders/helpers/worklist.ts`, `core/date-filters.ts`, `core/text-search.ts` |
| APK interno | `apps/mobile/eas.json`, `app.json`, `scripts/check-apk-env.mjs`, [guía de distribución](../apps/mobile/docs/android-apk.md) |
| UI web/admin | `apps/web/src/features/{orders,operations}/components/*DetailDialog.tsx`, `apps/web/src/styles/global.css` |
| API y SQL | `apps/api-gateway/docs/openapi.yaml`, las tres migraciones citadas arriba; [funciones SQL](./supabase-rpcs.md) |

## Verificaciones realizadas y límites

En las verificaciones acumuladas de estos cambios pasaron los typechecks de mobile, gateway, api-client y
query-hooks; se reconstruyó `@servicienta/types` al modificar contratos. También
pasaron lint del gateway y exportaciones web de Expo con las últimas pantallas.
La exportación valida bundling; no genera un APK ni prueba interacción nativa.

Las pruebas automáticas añadidas/evolucionadas cubren fechas, búsqueda,
composición de filtros, pertenencia, orden de listados y contadores con un
adaptador de consultas en memoria; esas pruebas no ejecutan las funciones de
búsqueda/agenda de PostgREST contra el proyecto remoto.

Para el rechazo con motivo pasaron cuatro pruebas de contrato/gateway y seis de
la migración real en PostgreSQL embebido (PGlite): estados, autor y motivo del chat,
idempotencia, pertenencia/permisos y rollback ante errores de chat/auditoría.
Esa base es descartable; no valida el despliegue remoto ni reemplaza QA en celular.
El comando de SQL y su dependencia temporal están en [supabase-rpcs.md](./supabase-rpcs.md#reject_operation_completion).

También pasaron el build de web, tipos de mobile y exportación mobile web después
de separar los botones de las cards; validación de variables del APK (valores
correctos, variables ausentes y rechazo de IP local), compilación del package de
tipos y lectura de la configuración por EAS. El build nativo todavía está en cola.

Para repetir desde la raíz:

```bash
pnpm --filter @servicienta/types build
pnpm --filter @servicienta/mobile --filter @servicienta/api-gateway --filter @servicienta/api-client --filter @servicienta/query-hooks check-types
pnpm --filter @servicienta/api-gateway lint
node --import tsx scripts/tests/list-filters.test.mts
node --import tsx scripts/tests/visit-attention.test.mts
node --import tsx scripts/tests/order-worklist.test.mts
node --import tsx scripts/tests/client-home-visits.test.mts
node --import tsx scripts/tests/client-visit-attention.test.mts
node --import tsx scripts/tests/client-order-history.test.mts
node --import tsx scripts/tests/reject-completion.test.mts
pnpm --filter web build
pnpm --filter @servicienta/mobile exec expo export --platform web --output-dir /tmp/servicienta-mobile-review
```

Las pruebas se ejecutan como scripts con `node --import tsx`, sin cambiar la
configuración de módulos del monorepo. El comando `mobile lint` sigue siendo un placeholder; no tomarlo como
validación real de ESLint.

## Recorrido pendiente en dispositivo y base real

1. Autenticar CLI, revisar historial y aplicar las migraciones pendientes al
   proyecto correcto. Confirmar que el gateway ya usa esas funciones sin errores.
2. Probar búsqueda por cada campo y varias palabras, y combinarla con estado,
   fecha, accesos rápidos y paginación. Verificar counters y orden con datos reales.
3. Revisar las tres bandejas de Pedidos y su historial; probar aceptado sin agenda,
   visita de hoy pasada, visita de ayer, cierre por confirmar, rechazo y terminales.
4. Revisar Pendientes/Sin completar de Visitas y el cambio de día argentino.
5. Probar todos los accesos al pop-up, Atrás, error de red y doble toque. El OK de
   VISITAS debe ocultarse para horas futuras; HOY conserva su comportamiento propio.
6. Completar con técnico y confirmar/rechazar con cliente; comprobar reseña,
   refresco de agenda/listas/chat y persistencia al volver a abrir la app. En rechazo,
   probar motivo vacío, Atrás, envío confirmado y doble toque: una sola acción en
   el chat con el cliente como autor, motivo visible para ambos y estado persistido.
7. Probar teclado y aplicación de búsqueda con un toque, cards en teléfono pequeño,
   navegación al cliente y apertura de mapas en Android/iOS. En navegador, abrir las
   cards con OK/opinión y verificar que no se repite el error de botones anidados.
8. Como admin web, guardar estados de pedido y visita desde el selector superior,
   comprobar badges, feedback y auditoría; corregir fechas inconsistentes cuando
   lo exija la validación. Revisar que otros roles no puedan usar estos endpoints.
9. Consultar el build de EAS; cuando termine, instalarlo desde su enlace en Android
   y probar login, agenda, cierre/rechazo, chat y mapas usando datos móviles.

Los [datos de prueba de Tomi](../apps/mobile/docs/test-data.md) tienen fechas fijas
de octubre/noviembre de 2026: el día de referencia del seed es **2026-10-20**.
No se desplazan al ejecutarlo otro día. Elegir casos por fecha real al probar HOY;
no resetear ni recrear datos automáticamente para retomar.

## Pendientes de producto/técnicos que siguen abiertos

- Continuidad desde `completion_rejected`: se muestra la indicación de coordinar
  por chat, pero el flujo de reagendado/resolución posterior sigue por definir.
- Validación end-to-end con base real y dispositivo: no se declaró terminado el MVP.
- Primer APK interno enviado a EAS, en cola en la última consulta del 2026-10-26.
  Verificar resultado, instalación y funcionamiento antes de distribuirlo. No se
  publicó en Google Play. EAS Update, iOS y notificaciones siguen pendientes.
- Rendimiento de búsqueda y campos calculados por fila con grandes volúmenes:
  medir antes de decidir índices o materialización. No se añadió ese trabajo.
- Pagos, rendiciones, reclamos, adjuntos, push y offline completo no se implementaron
  como parte de este tramo.

El checkout conserva cambios compartidos y archivos nuevos de estas funciones;
revisar `git status`/`git diff` antes de continuar. En este cierre se actualiza documentación y se consulta el estado del build ya
iniciado; no se aplican migraciones, seeds ni despliegues adicionales.
