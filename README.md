# frontend-asa

SPA de la biblioteca ASA. Los lectores buscan en el catálogo, ven la ficha de cada libro con sus ejemplares, reservan una copia y gestionan sus reservas. El administrador mantiene libros, ejemplares y lectores.

> **El backend es otro repo:** [backend-asa](https://github.com/CristanPalma2203/backend-asa) (.NET 10 + SQL Server). Este proyecto solo consume su API.

| Catálogo | Ficha del libro |
| --- | --- |
| ![Catálogo](docs/catalogo.png) | ![Ficha](docs/ficha.png) |

| Mis reservas | Administración |
| --- | --- |
| ![Mis reservas](docs/mis-reservas.png) | ![Admin](docs/admin.png) |

## Stack

- React 19, TypeScript y Vite.
- TanStack Router (rutas por archivo, tipadas) y TanStack Query (estado del servidor).
- Zustand para la sesión, persistida en `localStorage`.
- React Hook Form + Zod para los formularios y la validación de search params.
- Tailwind CSS 4, componentes estilo shadcn/ui (Radix) y sonner para los avisos.
- TanStack Table para la vista de tabla del catálogo.
- Vitest, Testing Library y MSW para los tests.
- Docker: build con Node 22 y nginx para servir los estáticos.

## Estructura

Organizo el código por **features**. Cada una trae su API, tipos, hooks, schemas y páginas. Las rutas son delgadas: definen la URL, los guards y el `search`, y montan la página de la feature.

```
src/
  routes/              Rutas de TanStack Router (routeTree.gen.ts se genera solo)
    __root.tsx           Layout, título por ruta, toaster
    catalogo.tsx         /catalogo
    libros.$idLibro.tsx  /libros/:idLibro
    mis-reservas.tsx     /mis-reservas (requiere sesión de lector)
    login.tsx            /login?redirect=…
    admin/               /admin/libros, /admin/libros/:idLibro, /admin/lectores (rol Admin)
  features/
    auth/              store (Zustand), login y guards (requireSession / requireAdmin)
    biblioteca/        api, types, estados, hooks (Query), queryKeys, schemas, errores y páginas
    admin/             páginas de administración de libros, ejemplares y lectores
  components/
    layout/            AppShell (público) y AdminShell
    ui/                botones, badges, inputs, diálogos…
  lib/
    api/client.ts      fetch tipado: token, ProblemDetails → ApiError
    fechas.ts          formateo UTC → America/El_Salvador
  config/env.ts        valida VITE_API_URL con Zod al arrancar
  test/                MSW (handlers, fixtures), setup y render con router
```

## Cómo correrlo

Primero levanto el backend, ya sea en Visual Studio (`https://localhost:44358`) o con `docker compose up` en el repo del backend (`http://localhost:8080`). El backend solo acepta CORS desde `http://localhost:5173`, así que el frontend tiene que servirse en ese origen.

### Con npm

Requiere Node 22.12 o superior.

```bash
cp .env.example .env    # ajusto VITE_API_URL según dónde corre la API
npm ci
npm run dev             # http://localhost:5173
```

### Con Docker

La URL de la API queda fija en el bundle al compilar, así que va como build arg:

```bash
docker build --build-arg VITE_API_URL=http://localhost:8080 -t frontend-asa .
docker run --rm -p 5173:80 --name frontend-asa frontend-asa
# http://localhost:5173
```

- La imagen es multi-stage: `node:22-alpine` compila y `nginx:alpine` sirve `dist/`.
- `nginx.conf` hace fallback a `index.html` para que funcionen los deep links (`/libros/1`, `/admin/...`). Los assets con hash se cachean como `immutable` y `index.html` va con `no-cache`.
- Si falta `VITE_API_URL`, el build falla con un mensaje claro.

Si `npm run dev` ya ocupa el 5173, hay que pararlo antes de `docker run`. Si no, el navegador seguirá llegando a Vite.

## Variables de entorno

| Variable | Obligatoria | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | Sí | `https://localhost:44358` (IIS Express) o `http://localhost:8080` (compose) |

Está en `.env.example`. `src/config/env.ts` la valida con Zod y, si falta o no es una URL, la app falla al arrancar con un mensaje explícito.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | `tsc -b` + build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run typecheck` | Chequeo de tipos sin emitir |
| `npm run lint` | ESLint |
| `npm test` | Vitest en modo run |
| `npm run format` | Prettier |

## Tests

```bash
npm test
```

Uso Vitest con jsdom, Testing Library y **MSW**, que intercepta `fetch` con handlers tipados contra el contrato de la API (`src/test/handlers.ts`). Cubren:

- **Catálogo:** listado, búsqueda con debounce que actualiza la URL, estado vacío y error.
- **Ficha:**
  - reservar sin sesión manda a login;
  - mensajes de `reserva-duplicada` y `sin-stock`.
- **Mis reservas:**
  - cancelación con *update optimista* y rollback si el servidor falla;
  - fecha mostrada en hora de El Salvador.
- **Login:** credenciales inválidas.
- **Cliente de API:** el estado del ejemplar y el filtro de reservas van como texto.
- **Mensajes de error por `code`.**
- **Schema del lector:** contraseña opcional, mínimo 8.
- **Formateo de fechas.**

En Windows, si Vitest responde "failed to find the runner", hay que abrir la terminal en `C:\…` (con la unidad en mayúscula). Es un problema conocido de Vitest con la letra de unidad.

## Decisiones

**TanStack Router.**

- Rutas por archivo con tipos de punta a punta: params, `search` validado con Zod y links tipados.
- Los guards van en `beforeLoad` (`requireSession`, `requireAdmin`) y redirigen a `/login?redirect=…`. Tras el login vuelvo a la ruta original.
- El título de cada página sale de `staticData.title`.

**TanStack Query.**

- Es todo el estado del servidor, con claves centralizadas en `queryKeys.ts`, `staleTime` de 30 s y sin reintentos en errores 4xx.
- Después de reservar o cancelar invalido catálogo, ficha y mis reservas.
- La cancelación es optimista: la reserva desaparece al instante y, si la API falla, restauro el snapshot.

**Zustand.**

- Guarda solo la sesión (token, expiración, rol, nombre, `lectorId`), persistida en `localStorage`.
- El cliente HTTP la lee fuera de React.
- Un token vencido no se envía.
- Un 401 cierra la sesión y lleva al login.

**Errores por `code`.**

- El backend responde ProblemDetails con un `code` estable (`sin-stock`, `reserva-duplicada`, `conflicto-concurrencia`…).
- `client.ts` lo convierte en `ApiError` y `errores.ts` lo traduce a un mensaje para el usuario. Nunca dependo del texto del servidor.
- Los `errors` por campo de `validacion-fallida` se pintan en el input que corresponde.
- Un `conflicto-concurrencia` al cambiar un ejemplar recarga la lista con el `rowVersion` nuevo.

**Fechas: UTC → El Salvador.**

- La API devuelve todo en UTC con `Z`. `formatearFecha` lo muestra con `Intl.DateTimeFormat('es-SV', { timeZone: 'America/El_Salvador' })`, sin depender de la zona del navegador.
- Si llegara un ISO sin zona, lo trato como UTC.

**Contrato tipado.** Los estados son uniones de texto (`'Activa' | 'Cancelada' | …`) que coinciden con lo que serializa el backend. Las etiquetas y colores de cada badge salen de `estados.ts`.

## Autor

Alex Palma. [GitHub](https://github.com/CristanPalma2203).
