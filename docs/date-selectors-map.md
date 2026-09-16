# Mapa de selectores de fecha y horario

_Ultima actualizacion: 2026-09-15_

## Objetivo

Tener en un solo lugar:

- donde se renderizan hoy los selectores de fecha/hora
- que funciones los consumen
- que validaciones existen hoy en frontend y backend
- que reglas de negocio conviene aplicar segun cada caso

Los selectores reales se usan al agendar visitas desde `operations` y desde el
chat del pedido. No hay formularios activos en `orders`, `users`,
`client_profiles` o `technician_profiles` que permitan elegir fechas manualmente.

## Componente compartido actual

### `DateTimePickerField`

Archivo:

- [apps/web/src/features/shared/components/DateTimePickerField.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/shared/components/DateTimePickerField.tsx:1)

Responsabilidad:

- renderizar calendario mensual
- permitir elegir dia
- ofrecer selector de hora/minutos en incrementos configurables
- serializar a un `input hidden` con formato local `YYYY-MM-DDTHH:mm`

Notas:

- admite `disablePastDates`, `preventPastTimeSelection`, `minuteStep` y
  `allowClear`
- los agendados técnicos usan bloqueo de fecha pasada, horario vencido del día y
  saltos de `10` minutos
- no conoce rol, estado ni disponibilidad del técnico; esas reglas permanecen
  en la superficie que lo usa y en backend

Conclusion:

- hoy es un componente de presentacion y captura
- aplica restricciones de captura configurables; las reglas de autorización y
  disponibilidad real viven afuera o todavía faltan

## Lugares donde hoy se usa

### 1. Agendado de operation desde tabla del tecnico

UI:

- [apps/web/src/features/operations/components/OperationsListPage.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationsListPage.tsx:449)

Submit:

- [apps/web/src/features/operations/components/OperationsListPage.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationsListPage.tsx:143)

Hook:

- `useScheduleOperation()` en el mismo archivo

API client / hook chain:

- [packages/query-hooks/src/operations/hooks.ts](/home/reivaj/0.ServiceApp/servicienta/packages/query-hooks/src/operations/hooks.ts:1)
- [packages/api-client/src/operations/client.ts](/home/reivaj/0.ServiceApp/servicienta/packages/api-client/src/operations/client.ts:1)

Backend:

- validator: [apps/api-gateway/src/operations/validators.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/validators.ts:49)
- service: [apps/api-gateway/src/operations/service.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/service.ts:221)

Contexto:

- lo usa el tecnico
- solo para `Operation.status = pending`
- al guardar pasa la operation a `scheduled`

### 2. Agendado de operation desde vista individual del tecnico

UI:

- [apps/web/src/features/operations/components/OperationDetailDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationDetailDialog.tsx:271)

Submit:

- [apps/web/src/features/operations/components/OperationDetailDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationDetailDialog.tsx:182)

Backend:

- mismo endpoint y mismas validaciones que el caso anterior

Contexto:

- equivalente funcional al modal de tabla
- cambia solo la superficie de UI

### 3. Edicion admin de `scheduled_at`

UI:

- [apps/web/src/features/operations/components/OperationDetailDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationDetailDialog.tsx:741)

Submit:

- [apps/web/src/features/operations/components/OperationDetailDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationDetailDialog.tsx:524)

Backend:

- validator: [apps/api-gateway/src/operations/validators.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/validators.ts:33)
- service update admin operation: [apps/api-gateway/src/operations/service.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/service.ts:673)

Contexto:

- lo usa admin
- permite setear, editar o limpiar `scheduled_at`
- no depende de un workflow guiado; es un patch administrativo

### 4. Edicion admin de `technician_completed_at`

UI:

- [apps/web/src/features/operations/components/OperationDetailDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationDetailDialog.tsx:757)

Submit:

- [apps/web/src/features/operations/components/OperationDetailDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationDetailDialog.tsx:524)

Backend:

- validator: [apps/api-gateway/src/operations/validators.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/validators.ts:33)
- service update admin operation: [apps/api-gateway/src/operations/service.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/service.ts:673)

Contexto:

- lo usa admin para correccion manual
- admite valor o `null`

### 6. Agendado desde el chat del pedido

UI:

- [apps/web/src/features/chat/components/ChatDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/chat/components/ChatDialog.tsx:361)

Contexto:

- lo usa el técnico sobre una visita `pending` vinculada al chat
- reutiliza `DateTimePickerField` y las mismas restricciones visuales del
  agendado desde visitas
- el endpoint de chat reutiliza `scheduleOperation`, por lo que conserva las
  mismas validaciones backend

### 5. Edicion admin de `completed_at`

UI:

- [apps/web/src/features/operations/components/OperationDetailDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationDetailDialog.tsx:764)

Submit:

- [apps/web/src/features/operations/components/OperationDetailDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationDetailDialog.tsx:524)

Backend:

- validator: [apps/api-gateway/src/operations/validators.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/validators.ts:33)
- service update admin operation: [apps/api-gateway/src/operations/service.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/service.ts:673)

Contexto:

- lo usa admin para correccion manual
- admite valor o `null`

## Contratos de datos relacionados

Dominio:

- [packages/types/src/operations/domain.ts](/home/reivaj/0.ServiceApp/servicienta/packages/types/src/operations/domain.ts:1)

Contratos:

- [packages/types/src/operations/contracts.ts](/home/reivaj/0.ServiceApp/servicienta/packages/types/src/operations/contracts.ts:1)

Campos de fecha/hora relevantes:

- `scheduled_at`
- `technician_completed_at`
- `completed_at`

Estados de `Operation`:

- `pending`
- `scheduled`
- `completed_tech`
- `completion_rejected`
- `completed`
- `cancelled`

Estados de `Order` relacionados:

- `accepted`
- `in_progress`
- `completed_tech`
- `completion_rejected`
- `completed`
- `cancelled`

## Validaciones actuales reales

### Frontend

Hoy el frontend:

- serializa fecha y hora en un `input hidden` local y lo transforma a ISO al
  enviar
- en agendado técnico y desde chat bloquea fechas pasadas, horarios ya vencidos
  del día y valores fuera del salto de 10 minutos
- deja los campos administrativos sin esas restricciones para permitir override

Eso ocurre en:

- [apps/web/src/features/operations/components/OperationsListPage.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationsListPage.tsx:37)
- [apps/web/src/features/operations/components/OperationDetailDialog.tsx](/home/reivaj/0.ServiceApp/servicienta/apps/web/src/features/operations/components/OperationDetailDialog.tsx:26)

### Backend

Hoy el backend valida:

- que el datetime exista cuando es obligatorio
- que el string sea parseable por `Date.parse(...)`
- que el status permita la accion
- al agendar, que la fecha sea futura y esté alineada al salto de 10 minutos
- en el patch administrativo, el orden temporal entre fecha agendada,
  finalización técnica y finalización del cliente cuando todas existan

No valida hoy:

- minimo de anticipacion
- horarios laborales
- franjas por tecnico
- feriados

Detalle:

#### Schedule operation

- `scheduled_at` obligatorio, parseable, futuro y alineado a 10 minutos
- `description` obligatoria
- solo se puede agendar si `operation.status === pending`

Referencias:

- [apps/api-gateway/src/operations/validators.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/validators.ts:49)
- [apps/api-gateway/src/operations/service.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/service.ts:221)

#### Admin patch operation

- `status` debe ser valido
- fechas parseables o `null`
- valida `scheduled_at <= technician_completed_at <= completed_at` cuando los
  valores correspondientes existen

Referencias:

- [apps/api-gateway/src/operations/validators.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/validators.ts:33)
- [apps/api-gateway/src/operations/service.ts](/home/reivaj/0.ServiceApp/servicienta/apps/api-gateway/src/operations/service.ts:673)

## Matriz de reglas recomendadas por selector

Esta seccion no describe lo que el sistema ya hace.
Describe lo que convendria implementar.

### A. Tecnico agenda una operation pendiente

Selector:

- `scheduled_at`

Reglas definidas:

- no permitir fechas pasadas
- no permitir horarios ya vencidos en el mismo dia
- restringir a incrementos fijos de `10` minutos
- limitar a una franja operativa base, por ejemplo `08:00-20:00`
- opcional: bloquear domingos o dias no laborables
- opcional: usar disponibilidad real del tecnico cuando exista

Reglas UX recomendadas:

- deshabilitar dias pasados en el calendario
- deshabilitar chips de horario invalidos segun el dia elegido
- mostrar copy contextual si hoy ya no quedan horarios validos
- preseleccionar proximo horario valido en vez de dejar el campo vacio

Reglas backend definidas:

- rechazar `scheduled_at < now`
- rechazar valores fuera de step permitido
- rechazar fuera de ventana operativa

### B. Admin corrige `scheduled_at`

Selector:

- `scheduled_at`

Reglas definidas:

- permitir pasado y futuro
- permitir limpiar el valor
- mantener validacion de datetime parseable
- opcional: mostrar warning si la fecha contradice el status actual

Reglas UX definidas:

- no bloquear administrativamente fechas pasadas
- diferenciar visualmente que es un override admin
- mostrar warning cuando los valores actuales contradicen el status o el orden temporal esperado

Reglas backend definidas:

- no imponer ventana operativa estricta al admin
- pero si validar consistencia minima cuando sea razonable:
  - `scheduled_at <= technician_completed_at` si ambas existen
  - `scheduled_at <= completed_at` si ambas existen

### C. Admin corrige `technician_completed_at`

Selector:

- `technician_completed_at`

Reglas definidas:

- permitir pasado
- permitir limpiar
- no permitir una fecha anterior a `scheduled_at` si `scheduled_at` existe
- no permitir una fecha posterior a `completed_at` si `completed_at` existe

### D. Admin corrige `completed_at`

Selector:

- `completed_at`

Reglas definidas:

- permitir pasado
- permitir limpiar
- no permitir una fecha anterior a `technician_completed_at` si existe
- no permitir una fecha anterior a `scheduled_at` si existe

## Reglas temporales de consistencia sugeridas

Si se implementan validaciones mas estrictas, estas son las mas razonables:

1. `scheduled_at` no puede ser menor que `now` cuando agenda un tecnico.
2. `technician_completed_at` no puede ser menor que `scheduled_at`.
3. `completed_at` no puede ser menor que `technician_completed_at`.
4. `completed_at` no puede ser menor que `scheduled_at`.
5. Si `status = pending`, idealmente `scheduled_at` deberia ser `null`.
6. Si `status = scheduled`, `scheduled_at` deberia existir.
7. Si `status = completed_tech`, `technician_completed_at` deberia existir.
8. Si `status = completed`, `technician_completed_at` y `completed_at` deberian existir.

## Dudas de producto todavia abiertas

Estas definiciones todavia no estan cerradas y conviene resolverlas antes de
seguir refinando el selector:

1. Hay una franja general global o cada tecnico tendra disponibilidad propia.
2. Se bloquean domingos y feriados.
3. La timezone oficial del negocio sera siempre local Argentina o dependera de la ubicacion del tecnico/cliente.
4. Al reprogramar en futuro, se permitira editar una operation ya `scheduled` desde tecnico.

## Propuesta de implementacion por capas

### `apps/web`

- mantener `DateTimePickerField` como componente visual reusable
- agregar props para restricciones:
  - `minDateTime`
  - `maxDateTime`
  - `minuteStep`
  - `disabledDates`
  - `disabledTimesForDate`
  - `allowPast`
  - `allowClear`

### `packages/types`

- si las reglas se vuelven contrato real, crear tipos compartidos para ventanas
  horarias o disponibilidad

### `apps/api-gateway`

- mover la regla fuerte al backend
- no depender del bloqueo visual del frontend
- separar validaciones de:
  - parseo de datetime
  - consistencia temporal
  - permisos por rol
  - reglas operativas del negocio

## Resumen ejecutivo

Hoy:

- el selector reusable es `DateTimePickerField`
- se usa en visitas y en el agendado desde chat
- el agendado técnico tiene restricciones visuales y backend de futuro/salto
- el patch admin valida consistencia temporal básica

Falta definir e implementar:

- bloqueo de fechas pasadas para tecnico
- franjas horarias validas
- step de minutos
- consistencia entre `scheduled_at`, `technician_completed_at` y `completed_at`
- diferencias explicitas entre restricciones de tecnico y override admin
