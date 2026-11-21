# Despliegue y detalles técnicos

## Variables de entorno

| Variable | Obligatoria | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | Sí | `http://localhost:8080` (backend en Docker) o `https://localhost:44358` (IIS Express) |

`src/config/env.ts` la valida con Zod al arrancar: si falta o no es una URL, la app falla con un mensaje explícito. Se fija en el bundle al compilar.

El backend solo acepta CORS desde los orígenes configurados (en local, `http://localhost:5173`).

## npm

Requiere Node 22.12 o superior (`engines` en `package.json`). `.npmrc` activa `legacy-peer-deps` para que npm 10 y npm 11 validen el mismo lockfile; por eso las peer dependencies obligatorias van declaradas en `package.json` (por ejemplo, `@testing-library/dom`).

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | `tsc -b` + build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run typecheck` | Chequeo de tipos sin emitir |
| `npm run lint` | ESLint |
| `npm test` | Vitest en modo run |
| `npm run format` | Prettier |

## Cloudflare Workers (wrangler)

Producción: https://frontend-asa.cristianpalma1703.workers.dev

`wrangler.jsonc` publica `dist/` como assets estáticos de un Worker, con `not_found_handling: "single-page-application"`, así que los deep links (`/libros/1`, `/admin/...`) caen en `index.html`.

```bash
VITE_API_URL=https://ca-asa-backend-test.politerock-5d0ff971.centralus.azurecontainerapps.io npm run build
npx wrangler deploy
```

### Cabeceras (`public/_headers`)

Vite copia el archivo a `dist/` y Cloudflare lo aplica a todas las respuestas:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: apaga cámara, micrófono, geolocalización, pagos y USB.

## Docker (alternativa)

```bash
docker build --build-arg VITE_API_URL=http://localhost:8080 -t frontend-asa .
docker run --rm -p 5173:80 --name frontend-asa frontend-asa
```

- Imagen multi-stage: `node:22-alpine` compila y `nginx:alpine` sirve `dist/`.
- `nginx.conf` hace fallback a `index.html` para los deep links, cachea los assets con hash como `immutable` y sirve `index.html` con `no-cache`. Añade las mismas cabeceras de seguridad, también en las respuestas de error.
- Si `npm run dev` ya ocupa el puerto 5173, hay que pararlo antes de `docker run`.

## CI

`.github/workflows/ci.yml` corre en cada push y pull request a `main`, con Node 22 y caché de npm: `npm ci`, `typecheck`, `lint`, `test` y `build`, con `VITE_API_URL=http://localhost:8080`.

## LuxIA y Rive

- El avatar es una animación Rive (`public/luxia/luxia.riv`, artboard `LuxIA`, state machine `LuxIA_oculta`). El componente que usa Rive se carga con `React.lazy`, en su propio chunk (`rive-luxia-*.js`, unos 230 kB).
- El runtime `.wasm` se sirve en local: `public/luxia/rive.wasm` y `rive_fallback.wasm` son copias de `@rive-app/canvas` 2.44.0, la versión que usa `@rive-app/react-canvas` 4.36.0. `rive-luxia.tsx` llama a `RuntimeLoader.setWasmUrl` y `setWasmFallbackUrl` antes del primer `useRive`, así que no se piden unpkg ni jsdelivr. **Al actualizar `@rive-app/react-canvas` hay que volver a copiar los dos `.wasm`.**
- Los inputs de la state machine siguen siendo la API usada; `Rive.suppressDeprecationWarnings = ['state-machine-inputs']` silencia ese aviso.
- Con «reducir movimiento» o sin canvas se usa la imagen estática `public/luxia/luxia.webp`.
- El historial se guarda en `localStorage` (`asa-luxia-history`, últimos 10 mensajes, como máximo 1000 caracteres por mensaje) y se borra al cerrar sesión, ante un 401 y con el token vencido.

## Huecos de carga (boneyard)

- `src/lib/boneyard.ts` fija la configuración global (colores, shimmer, `select: 'container'`).
- `Hueso` y `PortadaConCarga` (`src/components/ui/hueso.tsx`) envuelven el `<Skeleton>` de boneyard con un único hueso por hueco, definido a mano (`huesoUnico`), sin CLI ni capturas.
- Sobre fondos oscuros, `HUESO_OSCURO` usa lima translúcido. boneyard solo acepta el color del brillo en la configuración global, así que el brillo propio va por `boneClass` (`.hueso-brillo` en `index.css`).
- Con «reducir movimiento», el shimmer se detiene por CSS.

## Animaciones (GSAP)

- `src/lib/motion.ts` define `reveal`, `cardsIn`, `titleLines`, `pop`, la entrada y salida de diálogos, `lift` y `magnetic`.
- `useMotion` (`src/hooks/use-motion.ts`) usa `useGSAP` con el contenedor como scope y `revertOnUpdate`, así que todo se revierte al desmontar o al cambiar las dependencias.
- Con `prefers-reduced-motion`, `dur()` devuelve 0 y el contenido queda visible al instante (`clearProps`).
- Los diálogos siguen montados hasta que termina su animación de salida.
- El vuelo del avatar de LuxIA también es GSAP: `services/vuelo.ts` muestrea el arco (Bézier, 750 ms, easing aplicado una vez) en 25 poses y `luxia-fab.tsx` las recorre como keyframes lineales; el panel entra y sale con `useGSAP` y se desmonta al terminar la salida. El fondo animado del hero (`hero-backdrop.tsx`) va aparte, con su propio shader.

## Tests en Windows

Desde la terminal integrada de VS Code la ruta suele quedar como `c:\…`. Con la unidad en minúscula, Vitest carga dos veces el mismo módulo y todos los archivos fallan con «failed to find the runner». Hay que lanzar los comandos desde `C:\…`. El timeout por test es de 15 s (`vite.config.ts`).
