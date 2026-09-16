# Servicienta — Estado del código y tareas de septiembre

_Fecha de revisión: 2026-09-12_

## Resumen

Servicienta está en etapa de prototipo funcional. Existe implementación de gran
parte del recorrido cliente–técnico: búsqueda, registro, creación de pedido,
aceptación, agendado, cierre y review. También existe una primera versión de chat
interno asociado a pedidos.

El próximo hito es validar ese recorrido completo y corregir sus inconsistencias.
Las prioridades son el flujo operativo, las acciones administrativas y la
experiencia del chat. Pagos, liquidaciones y suscripciones siguen pendientes.

Este documento registra el estado observado en septiembre y conecta el código
con [anotacionesProxPrompt.txt](../anotacionesProxPrompt.txt). Complementa la
[fuente de verdad provisional](./source-of-truth.md); no cierra las decisiones
de dominio que todavía están abiertas.

## Alcance de la revisión

- Se revisaron documentación, historial y las implementaciones principales de
  frontend, gateway, contratos, migraciones y seeds.
- El último commit observado fue `d10fabd`, del 2026-06-30: primera implementación
  del chat y ajustes de UI del flujo operativo.
- El árbol de trabajo estaba limpio al realizar el análisis.
- Pasaron las comprobaciones de TypeScript de web y gateway:
  - `pnpm --filter web exec tsc -b --pretty false`
  - `pnpm --filter @servicienta/api-gateway check-types`
- No se ejecutó el recorrido end-to-end con usuarios ni se comprobó el estado
  de la base remota. La presencia de una migración en el repo no confirma que
  esté aplicada en el entorno de ejecución.

**Implementado** significa que existe código para ese comportamiento; no implica
que su funcionamiento completo haya sido validado en esta revisión.

## Producto y modelo actual

Servicienta conecta clientes que necesitan reparar equipos o electrodomésticos
con técnicos. Los roles actuales son `client`, `technician` y `admin`.

| Entidad | Responsabilidad |
|---|---|
| `User` | Identidad, autenticación, rol y estado de cuenta. |
| `ClientProfile` | Contacto y dirección habitual del cliente. |
| `TechnicianProfile` | Especialidades, marcas, cobertura, contacto, documentos y reputación del técnico. |
| `Order` | Pedido del cliente: problema, domicilio y técnico elegido. |
| `Operation` | Intervención de un técnico sobre un pedido. |
| `TechnicianReview` | Evaluación del técnico asociada a una operación concreta. |
| `ActivityEvent` | Registro de acciones y eventos del sistema. |
| `ChatConversation` | Hilo de conversación; la v1 implementa uno por pedido. |
| `ChatConversationParticipant` | Participantes y marca de última lectura. |
| `ChatMessage` | Mensajes de texto, sistema y acciones. |

El flujo prioritario es `client_selects`: el cliente elige al técnico. El flujo
`tech_applies`, donde los técnicos se postulan, sigue pendiente.

Una Order puede tener varias Operations en el modelo, pero las reglas avanzadas
para múltiples intervenciones y reasignaciones todavía no están resueltas.

### Flujo principal implementado

| Paso | Acción | Estado de Order | Estado de Operation |
|---|---|---|---|
| 1 | Cliente busca, elige técnico y solicita servicio | `pending` | No existe todavía |
| 2 | Técnico acepta | `accepted` | Se crea en `pending` |
| 3 | Técnico agenda | `in_progress` | `scheduled` |
| 4 | Técnico marca su trabajo terminado | `completed_tech` | `completed_tech` |
| 5 | Cliente confirma cierre | `completed` | `completed` |
| 6 | Cliente deja review | Sin cambio | Review asociada |

También existen cancelaciones y reviews sobre operaciones canceladas. Las reglas
de cancelación requieren revisar su coherencia entre UI y backend.

Cuando el cliente no reconoce la finalización informada por el técnico, Order y
Operation pasan a `completion_rejected`. La continuidad operativa desde ese estado
queda pendiente de definición.

La garantía no es un estado persistido `en_garantia`. La dirección actual es
derivarla de `technician_completed_at`; su duración y reglas completas siguen
abiertas. Los estados `open`, `confirmed` y `closed` que aparecen en documentos
antiguos no describen el flujo principal actual.

## Arquitectura

El proyecto usa Turborepo y pnpm workspaces.

```text
apps/web → packages/query-hooks → packages/api-client → apps/api-gateway → Supabase
```

| Ubicación | Responsabilidad y estado |
|---|---|
| `apps/web` | SPA React + Vite, sesión, navegación y pantallas. |
| `apps/api-gateway` | Express, autorización, validaciones y casos de uso. |
| `packages/types` | Tipos y contratos compartidos. |
| `packages/api-client` | Cliente HTTP tipado. |
| `packages/query-hooks` | Hooks de TanStack Query y gestión de caché. |
| `packages/supabase` | Clientes y tipos de persistencia compartidos. |
| `supabase/migrations` | Evolución versionada del schema. |
| `scripts` | Seeds y escenarios reproducibles. |
| `apps/landing` | Placeholder para landing pública con Next.js y SEO. |

La web usa Supabase Auth. Para el chat, Supabase Realtime avisa de mensajes nuevos
y la UI vuelve a consultar el historial por el gateway. Las escrituras de chat
pasan por el gateway; no hay inserts directos habilitados para el navegador en v1.

Los microservicios mencionados en notas iniciales no están implementados.

## Estado por área

| Área | Estado observado |
|---|---|
| Autenticación y roles | Implementación de sesión y controles de acceso; falta validación integral por rol. |
| Búsqueda pública | Implementada con perfiles públicos y búsqueda SQL/RPC. |
| Registro de cliente | Implementado dentro del flujo de contratación. |
| Perfiles y catálogos | Implementados perfiles de cliente/técnico, especialidades, marcas y zonas. |
| Orders y Operations | Tablas, detalles, acciones principales y calendario mensual de visitas para técnico/admin implementados; pendiente de QA completo. |
| Reviews de técnicos | Asociadas a Operation; cierre y cancelación admiten review según reglas actuales. |
| Auditoría | ActivityEvent y vista administrativa implementados. |
| Chat | Primera versión implementada, con UX y comportamientos por completar. |
| Administración de estados | Sigue existiendo edición manual; falta sustituirla por acciones con reglas. |
| Autorización y RLS | Hay controles implementados; la cobertura completa y consistente sigue pendiente de revisión. |
| `PlatformReview` | Propuesta sin implementación encontrada. |
| `Payment`, `Payout`, `Subscription` | Modelo conceptual, sin implementación funcional. |
| Landing pública SSR | Placeholder. |

### Evolución reciente

- Abril: perfiles técnicos, catálogos y búsqueda pública.
- Principios de mayo: perfiles de clientes, pedidos, operaciones y seeds.
- 13 de mayo: reviews vinculadas a operaciones.
- 27 de mayo: reorganización del flujo de selección, aceptación y cierre.
- 29 de junio: mejoras de registro, pantallas y eventos de actividad.
- 30 de junio: primera implementación de chat y ajustes de agendado.
- 15 de septiembre: calendario mensual de visitas para técnico y admin, con
  detalle diario scrollable cuando hay más de tres visitas.

## Relación con las anotaciones de continuidad

| Anotación | Estado y trabajo restante |
|---|---|
HECHO: | Probar flujo end-to-end con seed | Sigue siendo la prioridad principal. Existen escenario y checklist. |
HECHO: | Usar el chat para encontrar correcciones | Pendiente de prueba con sesiones de cliente, técnico y admin. |
| Pestaña de chats en sidebar | Implementada con listado, no leídos, estados de carga/vacío/error y apertura del chat. |
| Chat flotante o acoplado abajo en desktop | Pendiente. Actualmente se abre como modal. |
| Enter envía; Shift+Enter agrega salto | Pendiente. El textarea no tiene manejo específico de teclado. |
| Agilizar envío de mensajes | Falta medir latencia. El hook espera la API e invalida consultas; no tiene actualización optimista. |
| Agendar como técnico desde chat | Hay formulario, hook y endpoint que reutiliza `scheduleOperation`; falta probar y pulir. |
| Reemplazar edición libre de status | Pendiente para admin. Cliente y técnico ya tienen acciones específicas. |
| Confirmar/agendar, completar, cancelar y cerrar | Existen acciones del flujo normal; falta coherencia administrativa y validación integral. |
| Reviews de la plataforma sobre Order | `PlatformReview` sigue como propuesta. |

## Hallazgos que requieren seguimiento

Son observaciones de lectura del código, no fallos reproducidos en una sesión real.

### 1. Estados administrativos independientes

Los formularios admin permiten seleccionar estados manualmente. Los endpoints
actualizan Order y Operation por separado, lo que permite desalinearlas.

El reemplazo por botones debe incluir casos de uso backend compartidos que
controlen permisos, transiciones, timestamps y eventos. Cambiar solo la UI no
resuelve el problema.

Referencias:

- [Edición de Order](../apps/web/src/features/orders/components/OrderDetailDialog.tsx)
- [Edición de Operation](../apps/web/src/features/operations/components/OperationDetailDialog.tsx)
- [Servicio de orders](../apps/api-gateway/src/orders/service.ts)
- [Servicio de operations](../apps/api-gateway/src/operations/service.ts)

### 2. Escrituras múltiples durante transiciones

Aceptar una Order primero actualiza el pedido y luego crea la Operation mediante
otra escritura. Otras acciones también modifican varias entidades de forma
secuencial. Un fallo intermedio puede dejar un estado parcial.

Revisar atomicidad, concurrencia y solicitudes duplicadas en las transiciones
principales.

### 3. Cancelación diferente entre UI y backend

La UI bloquea cancelar una Order en `completed_tech`, mientras que `cancelOrder`
solo rechaza explícitamente `completed`. Definir la regla esperada y aplicarla
consistentemente en todas las entradas.

### 4. Zona horaria al agendar desde chat

El formulario del chat envía el valor de fecha local sin conversión explícita a
ISO con zona horaria. Otras pantallas realizan esa conversión. Probar con la zona
horaria real del navegador y del servidor, y unificar el contrato.

Referencia: [ChatDialog.tsx](../apps/web/src/features/chat/components/ChatDialog.tsx).

### 5. Comportamientos incompletos del chat

- El historial solicita hasta 100 mensajes y no ofrece controles para anteriores.
- El compositor no presenta al usuario el error de envío.
- La disponibilidad visual de agendar se basa en rol y presencia de operationId;
  debe comprobarse también su coherencia con el estado de la operación.
- Realtime invalida consultas y vuelve a cargar mensajes; falta medir el impacto
  en la respuesta percibida.

Permitir inserts desde el navegador cambiaría la arquitectura y exigiría resolver
permisos, validaciones y auditoría en ese camino. No está decidido hacer ese
cambio. Primero medir el envío actual y evaluar mejoras de caché y actualización
optimista con manejo de errores.

## Tareas priorizadas

### Prioridad 1 — Validar el recorrido operativo
REALIZADOS:
- [ ] Verificar configuración del entorno y migraciones aplicadas, especialmente
  las de junio para eventos, registro y chat.
- [ ] Preparar el escenario `orders-operations-realistic` en el entorno de prueba.
- [ ] Ejecutar el [checklist end-to-end](./full-flow-qa-checklist.md).
- [ ] Probar registro inline sin perder técnico, descripción ni domicilio elegidos.
- [ ] Recorrer aceptación, agendado, cierre técnico, cierre cliente y review.
- [ ] Probar cancelaciones y review sobre Operation cancelada.
- [ ] Probar acceso a recursos ajenos, acciones por rol y reviews duplicadas.
- [ ] Verificar estados, timestamps y ActivityEvents después de cada acción.
- [ ] Registrar resultados y pasos para reproducir cada fallo.

El escenario crea 20 usuarios: 2 admins, 8 técnicos y 10 clientes, junto con datos
operativos relacionados. Reinicia su dataset de prueba; revisar el destino antes
de ejecutarlo. Consultar [scripts/README.md](../scripts/README.md).

### Prioridad 2 — Corregir consistencia del flujo

- [ ] Unificar reglas de cancelación entre frontend y backend.
- [ ] Revisar atomicidad de las escrituras que afectan Order y Operation.
- [ ] Revisar doble clic, reintentos y solicitudes concurrentes.
- [ ] Unificar serialización de fecha/hora en chat y pantallas de operaciones.
- [ ] Confirmar reglas de agendado, reprogramación y cierre.
- [ ] Añadir pruebas de regresión para las reglas y fallos confirmados.

### Prioridad 3 — Completar chat v1

- [x] Probar intercambio de mensajes con dos sesiones abiertas y participación admin.
- [x] Añadir pantalla de conversaciones y acceso desde sidebar.
- [x] Mostrar estados de carga, vacío, error y mensajes no leídos.
- [ ] Adaptar el chat a ventana flotante/acoplada en desktop y vista usable en móvil.
- [x] Implementar Enter para enviar y Shift+Enter para salto de línea.
- [x] Mostrar errores de envío y permitir reintentar sin perder el texto.
- [x] Medir latencia y evaluar actualización optimista y actualización de caché.
- [ ] Permitir cargar mensajes anteriores al límite inicial.
- [x] Validar agendado desde chat, sus permisos y su disponibilidad según estado.
- [x] Comprobar actualización de Order, Operation, mensaje de acción y eventos tras agendar.

Conversaciones directas admin–usuario, archivos, presencia, indicadores de
escritura, búsqueda y moderación quedan para etapas posteriores.

### Prioridad 4 — Acciones administrativas de negocio

- [ ] Definir qué acciones puede ejecutar admin y cuándo.
- [ ] Reemplazar edición libre de status por acciones de agendar, completar,
  cancelar y cerrar según el flujo acordado.
- [ ] Reutilizar reglas backend del flujo operativo.
- [ ] Mantener consistencia entre Order, Operation y timestamps.
- [ ] Registrar actor y resultado en ActivityEvent.
- [ ] Definir si se necesitan correcciones excepcionales de fechas y cómo auditarlas.

### Prioridad 5 — Actualizar documentación

- [x] Actualizar fecha y descripción del estado en `source-of-truth.md`.
- [x] Corregir afirmaciones atrasadas del README sobre el schema implementado.
- [x] Actualizar inventario de módulos del gateway.
- [x] Actualizar el mapa de selectores con las validaciones que ya existen.
- [x] Marcar notas y ERD antiguos como históricos o alinearlos con el modelo actual.
- [x] Incorporar pruebas del chat al checklist end-to-end.

### Etapa posterior — Nuevas capacidades

- [ ] Definir `PlatformReview` sobre Order, separada de `TechnicianReview`.
- [ ] Definir autores admitidos: cliente y técnico vinculados al pedido.
- [ ] Definir estados habilitados, cantidad de reviews por autor/pedido y visibilidad.
- [ ] Resolver duración y reglas de garantía.
- [ ] Diseñar e implementar Payment, Payout y Subscription cuando corresponda.
- [ ] Completar autorización/RLS por entidad y rol.
- [ ] Resolver flujo `tech_applies` y múltiples intervenciones por pedido.
- [ ] Implementar landing pública y definir despliegue por aplicación.

## Documentación: qué está vigente y qué requiere cuidado

| Documento | Uso actual |
|---|---|
| [source-of-truth.md](./source-of-truth.md) | Referencia principal de dominio; contiene avances posteriores a su fecha de cabecera y frases atrasadas. |
| [chat-plan.md](./chat-plan.md) | Describe chat v1, endpoints, permisos y límites. |
| [full-flow-qa-checklist.md](./full-flow-qa-checklist.md) | Base práctica para las pruebas por rol; falta extenderla con chat. |
| [date-selectors-map.md](./date-selectors-map.md) | Mapa útil; parte de lo que marca como pendiente ya existe. |
| [api-gateway-architecture.md](./api-gateway-architecture.md) | Convenciones útiles; inventario de módulos desactualizado. |
| [supabase-workflow.md](./supabase-workflow.md) | Operación de migraciones y configuración del CLI. |
| [supabase-rpcs.md](./supabase-rpcs.md) | Explicación de búsqueda SQL/RPC; contrastar contratos con migraciones. |
| [project-notes.md](./project-notes.md) | Contexto histórico, con estados y pendientes anteriores. |
| [erd-schema.html](./erd-schema.html) | Diagrama histórico; no representa íntegramente el schema actual. |
| [turborepo-guide.html](./turborepo-guide.html) | Material explicativo del monorepo y sus capas. |

Ejemplo concreto de desactualización: el backend ya rechaza agendados pasados,
exige incrementos de diez minutos y valida el orden entre fechas en la edición
administrativa. El mapa de selectores todavía describe varias de esas reglas como
ausentes. No volver a implementarlas sin contrastar con
[operations/validators.ts](../apps/api-gateway/src/operations/validators.ts).

## Criterio de cierre del próximo hito

Un cliente debe poder crear un pedido, conversar con el técnico, recibir una
visita agendada, confirmar el trabajo y dejar una review. El técnico y el admin
deben ver datos y acciones coherentes durante todo el recorrido. Las cancelaciones,
errores de envío, permisos y reintentos deben tener comportamiento comprobado.

El cierre de este hito requiere evidencia de pruebas del recorrido real, además
de las comprobaciones de tipos que ya pasaron.
