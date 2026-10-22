# Datos de prueba de Tomi: octubre y noviembre de 2026

Este escenario agrega datos a cuentas existentes. No crea ni modifica usuarios,
perfiles ni catálogos; tampoco ejecuta el reset general de seeds.

## Distribución

- Técnico: `tomi.tech@test.com`.
- Clientes: `juan-user@lopez.com.ar` y `test-signup@test.com`.
- 40 pedidos: 20 por cliente; 20 pendientes y 20 en progreso con visita agendada.
- 20 visitas: 10 por cliente; 5 el **20 de octubre de 2026**, 10 en otras fechas
  de octubre y 5 en noviembre.
- 35 pedidos con fecha de creación en octubre y 5 en noviembre. Las fechas
  futuras son datos sintéticos para probar navegación mensual.
- Horarios calculados en Argentina (`UTC-3`), entre las 09:00 y las 17:00.

La fecha «hoy» de este escenario queda fijada al pedido original, 2026-10-20.
No se desplaza al volver a ejecutar el comando otro día.

## Comandos

Ejecutar desde la raíz. Se utilizan las credenciales de `scripts/.env` o
`scripts/.env.local`, igual que los demás scripts de seed.

```bash
# Consultar cuentas y mostrar el plan, sin escribir
pnpm seed:mobile-tomi

# Crear el escenario
pnpm seed:mobile-tomi -- --apply

# Consultar cuántos pedidos del escenario se eliminarían
pnpm seed:mobile-tomi -- --cleanup

# Eliminar solo este escenario
pnpm seed:mobile-tomi -- --cleanup --apply
```

## Identificación, repetición y limpieza

El tag fijo es `mobile-tomi-oct-nov-2026`. Los pedidos tienen la marca
`[seed:mobile-tomi-oct-nov-2026]` en `address_notes` y en la descripción; las
visitas también la muestran en su descripción. Se usan UUIDs determinísticos
para reconocer exactamente los registros creados por este script, sin agregar
columnas al dominio.

Repetir el seed omite registros existentes: no restablece estados ni horarios
modificados durante las pruebas. Para recuperar el escenario inicial, limpiarlo
y volver a crearlo. Si falla una inserción, los registros parciales conservan
la marca para reintentar o limpiar.

La limpieza comprueba UUIDs, técnico, clientes y marca de los pedidos antes de
borrarlos. Si se modifica o quita la marca de `address_notes`, se detiene para
no borrar un registro que ya no puede identificar con seguridad.

Se borran los pedidos del escenario y sus dependencias por las cascadas del
schema: visitas, reviews y chats ligados a esos pedidos, incluidos los creados
durante las pruebas. Las tres cuentas y los pedidos ajenos al escenario se
conservan. No usar `seed:cleanup`, que está orientado a usuarios seeded.

El escenario usa escrituras administrativas directas: no simula llamadas al
gateway ni genera una cronología de acciones. El chat se crea al abrirlo desde
la app mediante el flujo habitual.

## Validación del generador

```bash
pnpm check-types:scripts
TSX_TSCONFIG_PATH=tsconfig.scripts.json node --import tsx --test scripts/seeds/mobile/tomi-fixtures.test.ts
```
