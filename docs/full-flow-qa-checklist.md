# Checklist QA - Flujo completo cliente tecnico admin

_Ultima actualizacion: 2026-06-29_

## Preparacion

1. Aplicar migraciones:

   ```bash
   pnpm exec supabase migration up --linked
   ```

2. Cargar dataset operativo:

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

1. Cerrar sesion del cliente o usar otra ventana.
2. Ingresar con un tecnico seeded.
3. Abrir `/orders`.
4. Aceptar la order `pending` creada por el cliente.
5. Abrir `/operations`.
6. Agendar la operation.
7. Marcar `Completar tecnico`.
8. Verificar que la operation pasa a `completed_tech`.

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

## Validaciones negativas

1. Intentar crear order logueado como admin o tecnico: debe bloquearse.
2. Intentar review duplicada: debe devolver error.
3. Intentar review sobre operation ajena: debe devolver error.
4. Intentar review sobre operation `pending`, `scheduled` o `completed_tech`:
   debe devolver error.
5. Registrar usuario enviando metadata `role=admin`: debe quedar `client`.
