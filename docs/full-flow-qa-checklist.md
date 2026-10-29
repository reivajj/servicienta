# Checklist QA - Flujo completo cliente tecnico admin

_Última actualización: 2026-10-26_

## Preparacion

Este documento describe verificaciones por ejecutar, no resultados de QA ya
aprobados. El estado de ejecución y límites está en
[mobile-current-state.md](./mobile-current-state.md#verificaciones-realizadas-y-límites).

1. Consultar el historial del Supabase correcto y revisar/aplicar las migraciones
   necesarias, incluida `202610260001_reject_visit_completion_with_reason.sql`.
   Ver [login y vinculación](./supabase-workflow.md).

   ```bash
   pnpm exec supabase migration up --linked
   ```

2. Usar cuentas y datos existentes. Solo para una base de pruebas descartable que
   se quiera reinicializar, cargar el dataset operativo (el seed resetea datos de
   ese escenario; no ejecutarlo automáticamente para retomar):

   ```bash
   pnpm seed:scenario -- --scenario orders-operations-realistic
   ```

3. Levantar gateway y web:

   ```bash
   pnpm dev
   ```

4. Tener a mano credenciales seeded si `SEED_TAG=local-seed` y
   `SEED_DEFAULT_PASSWORD=servicienta123`:

   - Admin: `seed-local-seed-admin-1@servicienta.local`
   - Tecnico: `seed-local-seed-technician-3@servicienta.local`
   - Cliente: `seed-local-seed-client-11@servicienta.local`

## Flujo visitante y cliente nuevo

1. Abrir `/technician-search` sin sesion.
2. Buscar por una zona y electrodomestico con resultados.
3. Seleccionar un tecnico disponible.
4. Completar problema, direccion y notas.
5. En el mismo modal, elegir `Registrarme`.
6. Completar email, password, nombre, apellido y datos de contacto.
7. Enviar `Registrarme y crear order`.
8. Verificar que:
   - la cuenta queda logueada como `client`
   - se crea `client_profile`
   - se crea una `Order` `pending`
   - no se pierde tecnico ni descripcion elegidos antes del registro

## Flujo tecnico

1. Cerrar sesión del cliente o usar otra ventana. Ingresar como `tomi.tech@test.com`.
2. Desde el menú de cuenta abrir «Mi perfil», elegir varias zonas, electrodomésticos y marcas (una especialidad con «Todas las marcas» y otra con marcas específicas). Guardar y volver a entrar para comprobar persistencia.
3. Como visitante, buscar cada combinación configurada; debe aparecer el técnico. Desactivar su disponibilidad y comprobar que deja de aparecer; volver a activarla.
4. Comprobar que un cliente no puede leer ni guardar la oferta privada de otro técnico y que IDs de catálogo inválidos no alteran la oferta existente.
5. Continuar con el pedido del cliente.
6. Abrir `/orders` y aceptar el pedido pendiente.
7. Abrir `/operations`, agendar la visita y marcarla como terminada por técnico.
8. Verificar que la visita pasa a `completed_tech`.

## Flujo cliente

1. Volver a la sesion del cliente.
2. Abrir `/operations`.
3. Confirmar cierre de la operation `completed_tech`.
4. Verificar que pasa a `completed`.
5. Usar `Dejar review`.
6. Enviar rating y comentario.
7. Verificar que:
   - la review aparece en la tabla
   - no se puede crear una segunda review para la misma operation
   - el rating del tecnico cambia en busqueda publica o perfil admin

## Rechazo de finalización con motivo

1. Usar otra visita `completed_tech` y entrar como su cliente en mobile o web.
2. Pulsar “El trabajo no está terminado”/Rechazar finalización. Debe abrir un
   diálogo con explicación obligatoria y confirmación explícita del envío al chat.
3. Comprobar que un motivo vacío o de solo espacios no se envía. Pulsar Atrás:
   no cambia el estado ni aparece un mensaje en el chat.
4. Escribir un motivo y confirmar. Verificar `completion_rejected` en visita y
   pedido; motivo/fecha en la visita, sin modificar la descripción técnica.
5. Abrir el chat con cliente y técnico: debe haber un solo evento
   `operation.reject_completed`, con el cliente como autor y el motivo completo.
   Reintentar la misma solicitud no debe duplicarlo.
6. Revisar el detalle para ambos roles y la auditoría
   `operation.completion_rejected_by_client`. En cliente, el texto debe hablarle
   directamente (“Rechazaste…”). Ante un fallo, el diálogo debe permitir reintentar.

## Chat del pedido

1. Con cliente y técnico en sesiones separadas, abrir el chat desde el pedido.
2. Verificar que el encabezado muestra estado, contraparte y fecha de creación.
3. Enviar un mensaje como cliente y otro como técnico.
4. Verificar que cada mensaje aparece de inmediato, llega a la otra sesión y el
   contador/listado de chats se actualiza.
5. Como técnico, agendar una visita desde el chat y confirmar que se crea el
   mensaje de acción y cambia el estado de la visita.
6. Como admin, abrir el mismo chat y verificar que ve cliente, técnico, estado
   y el historial completo.

## Flujo cancelado con review

1. Crear otra order y hacer que el tecnico la acepte.
2. Desde tecnico, cancelar la operation antes de completarla.
3. Desde cliente, abrir `/operations`.
4. Dejar review sobre la operation `cancelled`.
5. Verificar que esa review afecta `rating` y `rating_count`.

## Flujo admin

1. Ingresar con admin seeded.
2. Revisar:
   - `/users`
   - `/client-profiles`
   - `/orders`
   - `/operations`
   - `/technician-profiles`
   - `/activity-events`
3. Desde tablas y vistas individuales, verificar:
   - ojito hacia pages individuales de `order` y `operation`
   - links desde cards de `Cliente` y `Técnico` hacia sus vistas
   - iconos de chat interno visibles para admin en cards de cliente/tecnico
4. En `/activity-events`, confirmar eventos esperados:
   - `user.client_onboarded`
   - `order.created`
   - `order.accepted`
   - `operation.created`
   - `operation.scheduled`
   - `operation.completed_by_technician`
   - `operation.completed_by_client`
   - `technician_review.created`
   - `operation.cancelled`
5. En `/operations`, cambiar a la vista Calendario y verificar que:
   - el técnico solo ve sus visitas y el nombre/email de cada cliente
   - el admin ve cliente y técnico en cada visita
   - cada día muestra como máximo tres tarjetas y `+N más` abre la agenda diaria
     scrollable

6. En el detalle administrativo de pedido y visita, cambiar el selector superior
   y guardar. Comprobar badge, listas, feedback de éxito/error y auditoría
   `admin.order_updated` / `admin.operation_updated`. El selector comparte el
   formulario de edición: se conservan validaciones de datos y fechas. Revisar cada
   entidad cuando se necesite corregir los dos estados; no se sincronizan solos.
7. Probar “Finalización rechazada” junto a un título largo: el texto debe quedar
   dentro del contorno del badge, sin comprimirse.

## Mobile en navegador y Android

1. En navegador, abrir Inicio del cliente, VISITAS y HOY con cards que tengan
   acciones de OK/confirmar/opinar. No debe aparecer el error de `<button>` anidado.
   Probar por separado abrir el detalle, completar/opinar y abrir dirección en mapas.
2. En el detalle de visita, verificar la card de cierre al principio y los botones
   inferiores Pedido | Técnico (cliente) o Pedido | Cliente (técnico), más Chat solo
   con icono. Abrir ambas fichas y regresar al origen.
3. Comprobar detalle de pedido/visita con nota completa y listados con nota de dos
   líneas; horarios mobile `13:00hs`. Enviar mensajes con el botón de solo icono,
   también con navegador angosto y teclado abierto.
4. Revisar el [primer build de EAS](https://expo.dev/accounts/reivajj/projects/servicienta/builds/a71e8e83-1f38-4e76-b92f-3c9aa328770d).
   Cuando termine, instalar la APK siguiendo [la guía](../apps/mobile/docs/android-apk.md).
   Con datos móviles, probar login, persistencia de sesión, pedidos, visitas, cierre,
   rechazo con motivo, opinión, chat y mapas. Cerrar Expo/Metro en la computadora:
   el APK debe seguir usando el gateway público.

## Validaciones negativas

1. Intentar crear order logueado como admin o tecnico: debe bloquearse.
2. Intentar review duplicada: debe devolver error.
3. Intentar review sobre operation ajena: debe devolver error.
4. Intentar review sobre operation `pending`, `scheduled` o `completed_tech`:
   debe devolver error.
5. Registrar usuario enviando metadata `role=admin`: debe quedar `client`.
6. Intentar usar `PATCH /api/admin/orders/:orderId` y
   `PATCH /api/admin/operations/:operationId` como cliente/técnico: debe bloquearse.
7. Rechazar una visita ajena, no completada por técnico o sin motivo: debe
   bloquearse sin cambiar estados ni crear mensajes.
