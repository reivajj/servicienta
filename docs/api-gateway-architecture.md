# API Gateway — Estructura actual

_Última actualización: 2026-03-20_

## Propósito

Este documento describe la estructura actual de `apps/api-gateway` y la convención vigente para seguir agregando features sin volver a un gateway desordenado.

No es una regla inmutable, pero sí la base actual de trabajo.

## Objetivo de la estructura

Separar claramente:

- bootstrap del proceso
- composición de la app Express
- infraestructura compartida
- middleware transversal
- rutas globales
- módulos de feature

La idea es evitar:

- un `index.ts` gigante
- rutas sueltas mezcladas con lógica
- helpers de infraestructura dentro de features
- validación, mapping y acceso a datos pegados en un único archivo

## Estructura actual

```txt
apps/api-gateway/src/
  app.ts
  index.ts
  env.ts
  core/
    auth.ts
    errors.ts
    http.ts
    http-response.ts
    supabase.ts
  middleware/
    async-handler.ts
    error-handler.ts
    not-found.ts
    request-id.ts
    request-logger.ts
  routes/
    health.ts
  users/
    mapper.ts
    router.ts
    service.ts
    types.ts
    validators.ts
```

## Responsabilidad de cada capa

### `index.ts`

Punto de entrada del proceso.

Responsabilidad:

- cargar variables de entorno locales
- construir la app
- iniciar `listen()`

No debería contener:

- rutas
- lógica de negocio
- acceso a Supabase
- validaciones

### `app.ts`

Composición principal de Express.

Responsabilidad:

- crear la instancia de Express
- registrar middleware global
- montar routers
- construir dependencias compartidas

Es el lugar donde se “arma” el gateway.

### `env.ts`

Lectura y validación de variables de entorno del gateway.

Responsabilidad:

- parsear env vars
- definir el shape de configuración de runtime

No debería mezclar lógica HTTP o de dominio.

## `core/`

Infraestructura compartida del gateway que no pertenece a una feature concreta.

### `core/auth.ts`

Helpers compartidos de autenticación HTTP.

Hoy:

- extracción de bearer token

### `core/supabase.ts`

Construcción del cliente server-side de Supabase.

### `core/errors.ts`

Jerarquía base de errores del gateway.

Hoy:

- `AppError`
- `UnauthorizedError`
- `ValidationError`

Regla:
si una pieza representa un tipo de error reutilizable del gateway, tiende a vivir acá.

### `core/http.ts`

Tipos HTTP compartidos del gateway.

Hoy:

- `RequestWithId`

### `core/http-response.ts`

Helpers para serializar respuestas HTTP consistentes.

Hoy:

- `ok(response, data, statusCode?)`
- `errorResponse(response, request, message, statusCode)`

Regla:
si una pieza define cómo responde el gateway en forma transversal, tiende a vivir en `core/`.

## `middleware/`

Lógica transversal que participa del pipeline de Express.

### `middleware/request-id.ts`

Asigna o propaga un `requestId` por request.

Comportamiento actual:

- reutiliza `x-request-id` si viene
- genera uno si no viene
- lo guarda en request
- lo expone en response header

### `middleware/request-logger.ts`

Logger básico de requests.

Hoy loguea:

- método
- URL
- status code
- duración
- `requestId`

### `middleware/async-handler.ts`

Wrapper para handlers async de Express.

Objetivo:

- evitar `try/catch` repetidos en routers
- delegar errores al pipeline

### `middleware/not-found.ts`

Transforma rutas no encontradas en un `404` consistente.

### `middleware/error-handler.ts`

Última capa del pipeline.

Objetivo:

- traducir errores a respuestas HTTP
- mantener un shape uniforme de error
- incluir `requestId`

Regla general:
si el comportamiento se aplica como pipeline de Express, debe vivir en `middleware/`.

## `routes/`

Rutas globales o no ligadas a una feature de negocio específica.

Hoy incluye:

- `health.ts`

Regla:
si una ruta no pertenece claramente a un módulo de dominio, puede vivir en `routes/`.

Ejemplos típicos:

- `health`
- `metrics`
- `version`

## `<feature>/`

Cada feature del gateway debería vivir en su propia carpeta.

Hoy existe:

- `users/`

### Patrón actual del módulo `users/`

#### `router.ts`

Define endpoints de la feature.

Responsabilidad:

- declarar rutas
- coordinar dependencias del módulo
- usar `async-handler`
- responder usando helpers HTTP

No debería:

- validar payloads complejos
- mapear filas
- contener lógica de negocio

#### `service.ts`

Contiene lógica de negocio y acceso a datos de la feature.

Responsabilidad:

- orquestar casos de uso
- hablar con Supabase
- decidir qué hacer con inputs ya validados

No debería:

- serializar HTTP
- definir rutas
- acumular validación y mapping si ya existen archivos dedicados

#### `validators.ts`

Valida input de la feature.

Responsabilidad:

- validar shape y reglas básicas de entrada
- lanzar errores de validación del módulo

#### `mapper.ts`

Traduce entre formas internas.

Responsabilidad:

- mapear fila de persistencia → contrato de dominio/API

#### `types.ts`

Tipos internos del módulo.

Responsabilidad:

- declarar tipos que no deben ir a `packages/types`

Ejemplos:

- formas crudas de DB
- tipos internos de auth del backend

## Qué tipos van en `packages/types` y cuáles no

Van en `packages/types`:

- contratos compartidos entre frontend y backend
- entidades de dominio que cruzan workspaces
- DTOs de request/response

No van en `packages/types`:

- tipos internos del backend
- filas crudas de DB usadas solo en el gateway
- tipos auxiliares de una feature server-side

Ejemplo real:

- `User` sí vive en `packages/types`
- `UserRow` no vive en `packages/types`
- `AuthenticatedUser` no vive en `packages/types`

## Pipeline actual del gateway

Orden actual en `app.ts`:

1. `cors`
2. `express.json`
3. `requestId`
4. `requestLogger`
5. routers globales y de features
6. `notFound`
7. `errorHandler`

Ese orden no es accidental.

Reglas:

- `requestId` debe correr antes del logger
- `notFound` debe correr después de los routers
- `errorHandler` debe ser el último middleware

## Convención sugerida para próximas features

Cuando aparezcan nuevas áreas del negocio, crear módulos hermanos de `users/`.

Ejemplos esperables:

```txt
orders/
technician-profiles/
client-profiles/
subscriptions/
payments/
```

Cada uno debería empezar al menos con:

- `router.ts`
- `service.ts`

Y crecer a:

```txt
<feature>/
  router.ts
  service.ts
  validators.ts
  mapper.ts
  types.ts
```

solo si la complejidad lo justifica.

## Reglas prácticas

- No volver a poner endpoints sueltos en `index.ts`.
- No mezclar infraestructura compartida con features de negocio.
- No usar `middleware/` para lógica de dominio.
- No usar `core/` como carpeta comodín.
- Si una pieza pertenece a una feature concreta, debe vivir dentro de esa feature.
- Los routers deben permanecer delgados.
- La validación no debería quedar pegada al router si la feature ya tiene `validators.ts`.
- El mapping no debería quedar pegado al service si la feature ya tiene `mapper.ts`.

## Convención de estilo adoptada en el gateway

- En guards cortos de una sola línea, preferir:
  - `if (!value) throw ...`
  - `if (!value) return ...`
- Mantener braces cuando:
  - hay más de una instrucción
  - mejora claramente la legibilidad
  - evita ambigüedad

No es una regla absoluta del lenguaje; es una convención local del gateway.

## Criterio de decisión rápido

Si estás dudando dónde poner algo:

- ¿Es bootstrap del proceso? → `index.ts` o `app.ts`
- ¿Es configuración/env? → `env.ts`
- ¿Es infraestructura compartida del gateway? → `core/`
- ¿Es pipeline transversal de Express? → `middleware/`
- ¿Es una ruta global? → `routes/`
- ¿Es lógica de una feature concreta? → carpeta de feature
- ¿Es contrato compartido con frontend? → `packages/types`
- ¿Es tipo interno de backend? → `src/<feature>/types.ts` o `src/core/`

## Uso recomendado por skills y futuras tareas

Este documento debería tomarse como referencia cuando:

- se agreguen nuevos endpoints al gateway
- se creen nuevas features server-side
- se reorganice código del gateway
- se necesite decidir dónde vive una responsabilidad
- se dude si algo es de infraestructura compartida o de feature

La expectativa es que los próximos módulos del gateway arranquen siguiendo este patrón, en lugar de crecer como archivos sueltos.

Si en el futuro esta estructura cambia, este documento debe actualizarse.
