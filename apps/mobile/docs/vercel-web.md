# Publicar la app mobile como web en Vercel

Este despliegue publica la interfaz de `apps/mobile` para abrirla desde Safari,
Chrome y otros navegadores. Usa la misma API y Supabase que la APK. Es un
proyecto de Vercel separado del despliegue de `apps/web`.

## Configuración en Vercel

1. Subir los cambios al repositorio conectado con Vercel.
2. En Vercel, elegir **Add New → Project** e importar ese mismo repositorio.
3. Usar un nombre propio para el proyecto, por ejemplo `servicienta-mobile`.
4. Configurar:

   | Opción | Valor |
   | --- | --- |
   | Root Directory | `apps/mobile` |
   | Framework Preset | `Other` |
   | Build Command | `pnpm build:web` |
   | Output Directory | `dist` |
   | Install Command | Automático, usando pnpm y el lockfile del monorepo |
   | Node.js Version | `22.x` |

5. Mantener habilitado **Include source files outside of the Root Directory in
   the Build Step**, porque la app importa paquetes de `packages/`.
6. Agregar estas variables para Production y, si se usan, Preview:

   | Variable | Valor |
   | --- | --- |
   | `EXPO_PUBLIC_API_URL` | URL HTTPS pública del gateway, sin `/api` ni otras rutas |
   | `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase usado por la web existente |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave pública/anon del mismo proyecto Supabase |

   En la web existente, las variables equivalentes tienen el prefijo `VITE_`.
   No usar `SUPABASE_SERVICE_ROLE_KEY`: las variables `EXPO_PUBLIC_*` se incluyen
   en el código que descarga el navegador.

7. Pulsar **Deploy** y abrir la URL entregada por Vercel.

`vercel.json` ya define el build, la carpeta de salida y la reescritura a
`index.html` para que recargar una ruta interna no devuelva un 404. La salida
`single` de Expo genera una SPA; no requiere un servidor Expo en producción.
El build compila primero `@servicienta/types`, cuyo código se importa desde su
carpeta `dist`.

## Verificación

Para exportar localmente desde la raíz del repositorio:

```bash
pnpm --filter @servicienta/mobile build:web
```

La salida está en `apps/mobile/dist/`. El comando usa las variables del entorno
o de `apps/mobile/.env`; en Vercel deben configurarse en el proyecto.
Cambiar una variable pública requiere un nuevo build/deploy.

Después del despliegue, comprobar desde un iPhone:

- Inicio de sesión y recuperación de la sesión al volver a abrir la app.
- Navegación y recarga de una ruta interna.
- Consulta y actualización de datos contra la API existente.
- Chat y selector de horarios en el navegador.

Para agregar un acceso en iPhone: abrir la URL en Safari y elegir
**Compartir → Agregar a pantalla de inicio**. Esto no convierte la web en una
app nativa ni agrega funcionamiento sin conexión.

## Referencias

- [Publicar sitios Expo, sección Vercel](https://docs.expo.dev/guides/publishing-websites/)
- [Monorepos en Vercel](https://vercel.com/docs/monorepos)
