# Mobile: estado actual y cómo retomar

_Última actualización: 2026-10-22. Cierre de la sesión de trabajo sobre agenda, filtros y cierre de visitas._

Este documento describe el código implementado en `apps/mobile` y los cambios
compartidos que necesita. Es el punto de entrada para retomar el trabajo;
[el roadmap](./mobile-app-roadmap.md) conserva el plan original y notas de
implementación. El dominio general sigue en [source-of-truth.md](./source-of-truth.md).

## Primer paso al retomar: verificar Supabase

**El código está preparado, pero la nueva agenda de PEDIDOS requiere aplicar
la migración `202610220002_add_order_worklist_fields.sql`. No fue aplicada por
el agente.** El último intento de consultar el historial remoto falló con
`Access token not provided`, por lo que el estado remoto no quedó verificado.

Revisar estas dos migraciones, en orden:

| Migración | Para qué se usa | Estado conocido al cierre |
| --- | --- | --- |
| [202610220001_add_order_operation_search_fields.sql](../supabase/migrations/202610220001_add_order_operation_search_fields.sql) | Búsqueda por notas, cliente, zona y artefacto. | Existe en el repo; aplicación remota sin verificar en esta sesión. |
| [202610220002_add_order_worklist_fields.sql](../supabase/migrations/202610220002_add_order_worklist_fields.sql) | Clasificación operativa de pedidos y orden por visita asociada. | Preparada en esta sesión; no aplicada por el agente. |

Ambas agregan funciones calculadas PostgREST, sin tablas ni columnas nuevas.
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

## Base de la app

- Expo + React Native + Expo Router, con configuración en `apps/mobile/app.json`.
- Sesión persistente de Supabase y protección de rutas con `MobileAccess`.
- Negocio a través de `query-hooks → api-client → api-gateway → Supabase`.
- Supabase directo desde mobile para Auth y Realtime del chat.
- Roles `technician` y `client`. El grupo de rutas `(technician)` contiene tabs
  compartidas; para cliente la primera pestaña es Búsqueda y para técnico es Hoy.
- El técnico tiene Hoy, Pedidos, Visitas, Chats y Perfil. El cliente también
  puede buscar técnicos, crear pedidos y confirmar/reseñar visitas.
- Configuración pública en `apps/mobile/.env`: `EXPO_PUBLIC_API_URL`,
  `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

La guía para levantar gateway/Expo, usar QR, túnel o emulador está en
[expo-development.md](../apps/mobile/docs/expo-development.md). El túnel de Expo
no publica el API Gateway: su URL debe ser accesible desde el teléfono.

## Comportamiento acordado de las pantallas

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
`CompleteVisitProvider`: OK del chat, OK de HOY/VISITAS, card explicativa y botón
fijo del detalle. El pop-up tiene título e icono OK en la misma fila (icono a la
derecha), explicación, confirmar y Atrás. Evita doble envío, muestra errores
y mantiene el modal abierto si falla la mutación.

El detalle conserva la card explicativa de cierre. Abajo quedan fijos **Chat |
Pedido**, con Completar visita debajo cuando corresponde. Tras el cierre técnico,
el cliente confirma o rechaza. Al confirmar puede enviar una reseña de 1 a 5
estrellas con comentario opcional; luego queda visible y no se ofrece reenviar.

La dirección abre mapas en cards, detalles y cabecera del chat: `geo:` en
Android, `maps:` en iOS y Google Maps web como alternativa. El nombre del cliente
en la cabecera del chat técnico es pulsable, 20% mayor y sin subrayado. Abre
`/orders/[orderId]/client`, una ficha con los datos de contacto/domicilio de ese
pedido, reutilizando `useCurrentOrder`. **No es el perfil administrativo global
del cliente** ni abre acceso a sus otros pedidos o direcciones.

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
| API y SQL | `apps/api-gateway/docs/openapi.yaml`, las dos migraciones citadas arriba; [funciones SQL](./supabase-rpcs.md) |

## Verificaciones realizadas y límites

Durante esta sesión pasaron los typechecks de mobile, gateway, api-client y
query-hooks; se reconstruyó `@servicienta/types` al modificar contratos. También
pasaron lint del gateway y exportaciones web de Expo con las últimas pantallas.
La exportación valida bundling; no genera un APK ni prueba interacción nativa.

Las pruebas automáticas añadidas/evolucionadas cubren fechas, búsqueda,
composición de filtros, pertenencia, orden de listados y contadores con un
adaptador de consultas en memoria. **No equivalen a ejecutar las funciones SQL
nuevas ni a verificar PostgREST contra el proyecto remoto.**

Para repetir desde la raíz:

```bash
pnpm --filter @servicienta/types build
pnpm --filter @servicienta/mobile --filter @servicienta/api-gateway --filter @servicienta/api-client --filter @servicienta/query-hooks check-types
pnpm --filter @servicienta/api-gateway lint
node --import tsx scripts/tests/list-filters.test.mts
node --import tsx scripts/tests/visit-attention.test.mts
node --import tsx scripts/tests/order-worklist.test.mts
pnpm --filter @servicienta/mobile exec expo export --platform web --output-dir /tmp/servicienta-mobile-review
```

Los tres archivos contienen 7, 2 y 3 pruebas respectivamente. Se ejecutan como
scripts con `node --import tsx`, sin cambiar la configuración de módulos del
monorepo. El comando `mobile lint` sigue siendo un placeholder; no tomarlo como
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
   refresco de agenda/listas/chat y persistencia al volver a abrir la app.
7. Probar teclado y aplicación de búsqueda con un toque, cards en teléfono pequeño,
   navegación al cliente y apertura de mapas en Android/iOS.

Los [datos de prueba de Tomi](../apps/mobile/docs/test-data.md) tienen fechas fijas
de octubre/noviembre de 2026: el día de referencia del seed es **2026-10-20**.
No se desplazan al ejecutarlo otro día. Elegir casos por fecha real al probar HOY;
no resetear ni recrear datos automáticamente para retomar.

## Pendientes de producto/técnicos que siguen abiertos

- Continuidad desde `completion_rejected`: se muestra la indicación de coordinar
  por chat, pero el flujo de reagendado/resolución posterior sigue por definir.
- Validación end-to-end con base real y dispositivo; no se declaró terminado el
  MVP ni se publicó/distribuyó una nueva build nativa en esta sesión.
- Distribución con EAS/development build sigue siendo parte del roadmap; no hay
  `eas.json` en `apps/mobile` al cierre. El identificador de app sí está en `app.json`.
- Rendimiento de búsqueda y campos calculados por fila con grandes volúmenes:
  medir antes de decidir índices o materialización. No se añadió ese trabajo.
- Pagos, rendiciones, reclamos, adjuntos, push y offline completo no se implementaron
  como parte de este tramo.

El checkout conserva cambios compartidos y archivos nuevos de estas funciones;
revisar `git status`/`git diff` antes de continuar. En este cierre solo se actualiza
documentación; no se aplican migraciones, seeds ni despliegues.
