# Chat interno modular

_Ultima actualizacion: 2026-06-30_

## Objetivo

El chat interno permite conversaciones dentro de la app entre `client`,
`technician` y `admin`.

La primera version implementa conversaciones vinculadas a una `Order`. El
modelo ya queda preparado para conversaciones `direct` futuras entre admin y un
usuario, sin depender de una order.

## Modelo

### ChatConversation

Representa un hilo de conversacion.

Campos principales:

- `conversation_type`: `order | direct`
- `order_id`: requerido cuando `conversation_type = order`
- `status`: `open | closed | archived`
- `created_by`
- `last_message_at`

Reglas:

- Para `order`, hay una sola conversacion por `Order`.
- Para `direct`, `order_id` queda `null`; la UI direct queda para una etapa
  posterior.

### ChatConversationParticipant

Representa usuarios participantes del hilo.

Campos principales:

- `conversation_id`
- `user_id`
- `participant_role`: `client | technician | admin`
- `joined_at`
- `last_read_at`

Reglas:

- Client y technician se agregan automaticamente desde la `Order`.
- Admin se agrega cuando entra al hilo.
- `last_read_at` alimenta unread count.

### ChatMessage

Representa mensajes visibles en el hilo.

Tipos:

- `text`: mensaje escrito por un usuario.
- `system`: evento generado por backend.
- `action`: resultado de una accion funcional dentro del chat.

Campos principales:

- `sender_id`: nullable para system messages.
- `body`
- `action_type`
- `action_payload`
- `related_order_id`
- `related_operation_id`

## API

Endpoints implementados:

- `GET /api/chat/conversations/current`
- `GET /api/chat/conversations/orders/:orderId`
- `GET /api/chat/conversations/:conversationId/messages`
- `POST /api/chat/conversations/:conversationId/messages`
- `POST /api/chat/conversations/:conversationId/read`
- `POST /api/chat/conversations/:conversationId/actions/schedule-operation`

La escritura pasa siempre por API Gateway. El browser no inserta mensajes
directamente en Supabase.

## Realtime

La UI usa Supabase Realtime para suscribirse a inserts en `chat_messages`.

Cuando llega un mensaje nuevo:

- se invalida el query de mensajes del hilo
- se invalida la lista de conversaciones
- el historial se vuelve a consultar por API Gateway

## Permisos

- Client accede a chats de sus propias orders.
- Technician accede a chats de orders asignadas a su perfil.
- Admin accede a cualquier chat y puede sumarse como participante.
- RLS permite lectura a participantes y admin.
- RLS no habilita inserts directos desde browser en v1.

## Acciones v1

La accion implementada es agendar operation desde chat.

Flujo:

1. Tecnico abre chat desde una operation.
2. Usa accion de calendario.
3. Selecciona fecha/hora con el selector existente.
4. El frontend llama `schedule-operation` del chat.
5. El backend reutiliza la logica existente de `scheduleOperation`.
6. Se crea un mensaje `action` con el resultado.
7. Se registra `ActivityEvent`.

## Futuro

Pendiente para proximas etapas:

- conversaciones `direct` admin-user en UI
- archivos o fotos
- presencia online
- typing indicators
- busqueda en mensajes
- moderacion/borrado/edicion de mensajes
- mas acciones desde chat: cancelar, completar tecnico, confirmar cierre
