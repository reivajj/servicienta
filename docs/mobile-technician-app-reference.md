# Referencia visual para la futura app móvil del técnico

_Fecha de análisis: 2026-10-12_

## Propósito

Este documento registra aprendizajes obtenidos de seis capturas de una aplicación
móvil que usa un técnico en otro trabajo. La aplicación observada es más simple
que Servicienta: organiza pedidos y visitas, muestra datos operativos y registra
importes/rendiciones, pero no tiene chat interno.

Las capturas son **inspiración de producto y UX**, no una definición del diseño
final ni una fuente de verdad del dominio. Cualquier implementación debe
contrastarse con [source-of-truth.md](./source-of-truth.md) y con pruebas reales
con técnicos.

## Qué muestran las capturas

### Navegación principal orientada al trabajo diario

La barra inferior divide el trabajo en seis áreas:

- `Hoy`: pedidos nuevos o asignados para la jornada.
- `A realizar`: visitas pendientes de ejecución.
- `A rendir`: trabajos cobrados cuyo dinero todavía debe rendirse.
- `Taller`: trabajos o equipos que continúan fuera de la visita inicial.
- `Reclamos`: incidencias posteriores.
- `Historial`: aparece como una sección adicional en otra captura, con pedidos
  agrupados por fecha.

Los badges numéricos hacen visibles las colas pendientes. La estructura está
pensada alrededor de preguntas concretas del técnico: qué tengo hoy, qué me
falta hacer y qué me falta rendir.

### Bandeja de pedidos

La pantalla del día muestra:

- fecha y cantidad de pedidos;
- buscador por cliente, dirección o equipo;
- tarjetas compactas con cliente, equipo, dirección, zona y franja horaria;
- etiquetas de estado como `Nuevo` y `Sin aclarar`;
- expansión o acceso al detalle desde cada tarjeta.

La tarjeta permite reconocer el próximo trabajo sin abrir el detalle. Color,
badges y orden visual señalan urgencia o estado, mientras los datos operativos
más importantes siguen siendo texto legible.

### Historial agrupado cronológicamente

El historial ofrece:

- total de pedidos;
- búsqueda por cliente, dirección o equipo;
- filtros `Desde` y `Hasta`;
- agrupación por día con cantidad de pedidos;
- tarjetas que resumen horario, cliente, dirección, equipo, estado, importe,
  garantía y estado de rendición.

Esta agrupación por fecha es más útil para trabajo de campo que una tabla
tradicional. Permite reconstruir rápidamente qué se hizo en una jornada.

### Detalle operativo del pedido

El detalle se abre como una hoja o modal de altura completa y mantiene acciones
fijas en la parte inferior. Los datos visibles incluyen:

- número del pedido;
- fecha y franja horaria;
- nombre y teléfono del cliente;
- dirección y zona;
- equipo y desperfecto;
- estado;
- trabajo realizado;
- rendición;
- repuestos e importe de repuestos;
- monto cobrado, seña y gastos;
- garantía;
- observaciones;
- remitos o facturas adjuntas.

Las acciones rápidas observadas son:

- llamar al cliente;
- copiar los datos;
- copiar una aclaración;
- adjuntar remito o factura mediante foto o PDF;
- cerrar el detalle.

### Cronología del trabajo

El pedido incluye una cronología legible con fecha, hora, actor y descripción.
Registra, entre otras cosas:

- pedido agendado;
- reprogramaciones;
- aclaraciones;
- cambios de estado;
- cobros;
- reaperturas.

Esto funciona como historial operativo y ayuda a responder qué ocurrió, quién
lo hizo y cuándo, sin depender de recordar conversaciones externas.

## Datos útiles para Servicienta

### Prioridad alta para una app móvil

1. **Inicio centrado en la jornada.** La primera pantalla del técnico debería
   priorizar las visitas de hoy, la siguiente visita y las acciones pendientes,
   no un dashboard administrativo genérico.
2. **Tarjetas con información suficiente.** Cada visita debería mostrar como
   mínimo horario, cliente, zona/dirección resumida, equipo, problema y estado.
3. **Acciones inmediatas.** Abrir chat, llamar, copiar dirección/datos, agendar,
   reprogramar, cancelar y completar deberían requerir pocos toques.
4. **Agrupación temporal.** Agenda e historial deberían agruparse por día y
   permitir búsqueda por cliente, dirección, equipo o descripción.
5. **Colas explícitas.** Badges o contadores pueden mostrar pedidos nuevos,
   visitas por realizar, conversaciones sin leer y futuras tareas financieras.
6. **Acciones fijas en el detalle.** En pantallas largas, las acciones primarias
   deben seguir disponibles sin volver al inicio.
7. **Cronología unificada.** Los `ActivityEvent`, mensajes de acción del chat y
   cambios relevantes pueden alimentar una línea de tiempo comprensible para
   el técnico.

### Valor diferencial de Servicienta

Servicienta ya tiene chat por pedido. En móvil puede reemplazar parte de las
“aclaraciones” de la aplicación de referencia y convivir con acciones
estructuradas:

- aceptar un pedido y abrir inmediatamente su chat;
- coordinar y agendar desde la conversación;
- producir mensajes de acción al agendar, reprogramar o cancelar;
- mantener la cronología del pedido separada del texto libre, aunque ambos se
  presenten juntos cuando resulte útil.

El chat no debería ocultar los datos operativos: dirección, horario, equipo y
estado deben seguir disponibles como contexto persistente.

## Correspondencia provisional con el dominio actual

| Concepto observado | Servicienta actual o futura |
|---|---|
| Pedido asignado | `Order` con flujo `client_selects` |
| Visita agendada | `Operation` con estado `scheduled` |
| Hoy / A realizar | Proyecciones de `Operation` por fecha y estado |
| Historial | `Order` y `Operation` agrupadas por fecha |
| Cronología | `ActivityEvent` más acciones relevantes del chat |
| Nuevo / Sin aclarar | Estado o indicador de atención; todavía por definir |
| Trabajo realizado | Descripción o cierre técnico de `Operation`; contrato a revisar |
| Garantía | Dato derivado de `technician_completed_at`; reglas pendientes |
| Monto cobrado | Futuro `Payment`; no implementado |
| A rendir | Futuro flujo financiero; no equivale automáticamente a `Payout` |
| Repuestos y gastos | Concepto futuro que necesita modelado propio |
| Remitos/facturas | Futuros adjuntos con storage, permisos y auditoría |
| Reclamo/reapertura | Posible flujo posterior a cierre o garantía; no definido |
| Taller | Posible etapa o tipo de intervención; no definido |

La columna derecha es una interpretación inicial. No deben agregarse estados o
entidades solo para copiar la aplicación de referencia.

## Ideas para la arquitectura de información móvil

Una dirección razonable para explorar, sujeta a validación, es:

1. `Hoy`: agenda diaria y pedidos recién aceptados.
2. `Visitas`: pendientes, agendadas y calendario.
3. `Chats`: conversaciones y no leídos.
4. `Actividad`: historial de trabajos agrupado por fecha.
5. `Más`: perfil, oferta, documentos y, en el futuro, dinero/reclamos.

Los futuros módulos financieros podrían promoverse a una pestaña principal si
las pruebas muestran que “cobrar” o “rendir” es una tarea diaria central.

## Patrones visuales que vale la pena conservar

- Tema oscuro de alto contraste, sujeto a una alternativa clara y accesible.
- Color de acento consistente para navegación y acciones principales.
- Tarjetas compactas con jerarquía fuerte: estado, cliente, ubicación, equipo y
  horario.
- Chips de estado con texto; no depender solamente del color.
- Contadores visibles en navegación.
- Buscador ancho y fácil de alcanzar.
- Detalle de pantalla completa en móvil, con cierre claro y barra de acciones
  fija.
- Secciones largas divididas por títulos, en vez de una lista plana de campos.

## Aspectos que conviene adaptar o evitar

- No mostrar información sensible más allá de lo necesario para la visita.
- No exponer enlaces internos o URLs crudas como observaciones; los adjuntos
  deberían tener nombre, tipo, vista previa y descarga autorizada.
- Evitar copiar datos personales completos al portapapeles sin una acción clara
  y feedback al usuario.
- Mantener tamaños táctiles y contraste accesibles; varios textos y badges de la
  referencia son pequeños.
- Evitar depender de emojis para representar estados de negocio.
- No mezclar estado operativo, estado de pago y estado de rendición en una sola
  etiqueta.
- No convertir la cronología en una vía alternativa para editar el negocio:
  debe ser consecuencia auditable de acciones válidas.
- Las llamadas telefónicas deben ser una opción; el chat interno sigue siendo el
  canal trazable preferido dentro de Servicienta.
- Adjuntos, montos y datos del cliente deben respetar permisos, retención y RLS.

## Hipótesis para validar con técnicos

- ¿La pantalla inicial debe ser la agenda de hoy o los pedidos nuevos?
- ¿Qué cinco datos necesitan ver antes de aceptar o abrir una visita?
- ¿Usan más una hora exacta o una franja horaria?
- ¿Con qué frecuencia llaman, copian la dirección o abren navegación/mapas?
- ¿Necesitan distinguir trabajo en domicilio de trabajo en taller?
- ¿Cuándo consideran que un pedido entra en garantía y cómo gestionan reclamos?
- ¿Quién cobra, quién rinde y qué comprobantes necesita adjuntar?
- ¿Qué eventos de la cronología ayudan realmente y cuáles generan ruido?
- ¿Qué acciones necesitan funcionar con conectividad inestable?

## Criterio para usar esta referencia

Al diseñar la app móvil, usar estas capturas para orientar densidad de
información, navegación por tareas, acciones rápidas y cronología. Mantener el
modelo, los permisos y los estados propios de Servicienta. Antes de implementar
dinero, taller, reclamos o adjuntos, definir sus reglas de dominio y validar el
flujo con técnicos reales.
