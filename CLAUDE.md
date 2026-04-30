# Planificador Inteligente de Alimentación — CLAUDE.md

## Stack

- **Next.js 14** App Router — route group `(dashboard)` agrupa las páginas de UI; las rutas reales son `/`, `/menu`, `/shopping-list` (sin `/dashboard` en la URL)
- **Prisma + PostgreSQL** — `db push` (no `migrate deploy`), no existen archivos en `prisma/migrations/`
- **Tailwind CSS**
- **Claude API** (`@anthropic-ai/sdk`) — modelo `claude-sonnet-4-6`
- **Zod** para validación de entradas en el servidor

## Comandos

```bash
npm run dev       # desarrollo en localhost:3000
npm run build     # build de producción
npx prisma db push        # sincronizar schema con la BD
npx prisma studio         # explorar datos en el navegador
```

## Arquitectura

### Sesión

Sin autenticación. Cada usuario se identifica por la cookie `planificador_session` (httpOnly, 1 año).

Siempre usar los helpers de `lib/session.ts`:
- `getOrCreateUser()` — para rutas POST que necesitan usuario. Hace upsert y devuelve `{ user, sessionId, isNew }`
- `getUserFromSession()` — para rutas GET. Solo lee, nunca crea registros
- `applySessionCookie(response, sessionId)` — aplica la cookie a la respuesta cuando `isNew` es true

**Nunca** llamar a `prisma.user` directamente desde las API routes — siempre pasar por estos helpers.

### Errores

Usar `apiError(message, status, logContext?)` de `lib/errors.ts`:
- 5xx → devuelve mensaje genérico al cliente, loguea el detalle
- 4xx → devuelve el mensaje exacto al cliente

### Validación

El perfil se valida con Zod en `lib/validators/profile.ts`. Objetivos válidos: `bajar_peso`, `ganar_musculo`, `mantener`, `saludable`. Personas: entero entre 1 y 10.

### Generación de menú con IA

`lib/ai/claude.ts` expone:
- `generarMenuSemanal(profile)` → `MenuSemanal` (7 días × 3 comidas, max_tokens: 8096)
- `generarListaCompras(menu, personas)` → `CategoriaCompras[]` (max_tokens: 4096)
- `menuFallback()` / `listaFallback()` — datos estáticos para cuando Claude falla

`services/menu.service.ts` envuelve las llamadas en try/catch y usa el fallback silenciosamente si Claude falla. Devuelve `{ menu, lista, usedFallback }`.

### Base de datos

Modelos Prisma:
- `User` — identificado por `sessionId` único
- `Profile` — uno por usuario, relación 1:1
- `WeeklyMenu` — múltiples por usuario, campo `activo: Boolean` indica el vigente. Al generar uno nuevo se desactivan los anteriores con `updateMany`
- `ShoppingList` — uno por menú (`menuId @unique`), relación 1:1 con `WeeklyMenu`

## Deploy (Railway)

- Builder: NIXPACKS
- Build: `npm install && npx prisma generate && npm run build`
- Start: `node_modules/.bin/prisma db push --accept-data-loss && npm start`
- Healthcheck: `GET /api/health` — hace `SELECT 1` real a la BD
- Variables requeridas: `DATABASE_URL`, `ANTHROPIC_API_KEY`
- `DATABASE_URL` debe apuntar al servicio PostgreSQL de Railway usando la referencia `${{Postgres.DATABASE_URL}}`

## Convenciones

- Las API routes llaman a los services, no a Prisma directamente
- Los services son los únicos que importan `prisma` (desde `lib/db.ts`)
- Los errores de Claude se capturan en `menu.service.ts`, no en la API route
- `next.config.js` no tiene `output: 'standalone'` — era incompatible con el route group `(dashboard)`
- No hay archivos de migración; usar siempre `prisma db push`
