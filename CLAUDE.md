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

### Cuándo cambiar a `prisma migrate deploy`

Actualmente se usa `prisma db push` porque no existen archivos en `prisma/migrations/`.
Cambiar al flujo de migraciones cuando:
1. Se ejecute `npx prisma migrate dev --name init` localmente (crea `prisma/migrations/`)
2. Se haga commit de esa carpeta al repositorio
3. Se cambie `startCommand` en `railway.json` a: `node_modules/.bin/prisma migrate deploy && npm start`
4. Se actualice el script `build` en `package.json` eliminando el `prisma db push`

**No cambiar antes** — `migrate deploy` sin archivos de migración falla con error en Railway.

## Rate limiting

- Límite: 5 generaciones de menú por usuario por día
- Zona horaria del contador: UTC (Railway). El día resetea a las 00:00 UTC = ~21:00 CLT
- Respuesta al exceder: HTTP 429 con mensaje en español
- Implementado en: `app/api/menu/generate/route.ts` via `countMenusToday()` en `services/menu.service.ts`
- No afecta: GET /api/menu, GET /api/shopping-list, GET /api/profile

## Logs

- Helper: `lib/logger.ts` — emite JSON por línea: `{ level, event, userId?, timestamp, metadata? }`
- Visibles en: Railway → Deployments → Logs
- Eventos registrados: `menu.generate.request`, `menu.generate.success`, `menu.generate.fallback`, `menu.rate_limit`, `profile.saved`, `prices.compare`
- No se loguean: sessionId completo, datos personales, claves API

## Comparador de precios (Fase 2)

Estado actual: mock con precios CLP estáticos para ~30 productos chilenos.

### Checklist para scraping real

- [ ] `lib/scrapers/lider.scraper.ts` — implementar fetch a API interna de Lider.cl
- [ ] `lib/scrapers/jumbo.scraper.ts` — implementar fetch a API interna de Jumbo.cl
- [ ] Normalización de nombres de productos (ej: "pechuga" → "pechuga de pollo")
- [ ] Cache de precios — guardar en BD o Redis con TTL de 1h para no hacer scraping en cada request
- [ ] Modelo Prisma `PriceCache` — `{ producto, supermercado, precio, fetchedAt }`
- [ ] Comparación total por supermercado — sumar todos los ítems encontrados por tienda
- [ ] Manejo de rate limits / bloqueos de los sitios (User-Agent, delays)
- [ ] Test de precios antes de mostrar (detectar precios anómalos)

Archivos a modificar cuando se implemente: `services/price-comparator.service.ts`, `lib/scrapers/`, `app/api/prices/route.ts`.

## Convenciones

- Las API routes llaman a los services, no a Prisma directamente
- Los services son los únicos que importan `prisma` (desde `lib/db.ts`)
- Los errores de Claude se capturan en `menu.service.ts`, no en la API route
- `next.config.js` no tiene `output: 'standalone'` — era incompatible con el route group `(dashboard)`
- No hay archivos de migración; usar siempre `prisma db push`
- Todos los errores en API routes deben usar `logger.error()` + `apiError()`, nunca `console.error` directo
