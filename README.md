# 🥗 Planificador Inteligente de Alimentación

Aplicación web que genera menús semanales personalizados con IA y listas de compras automáticas con comparador de precios entre supermercados chilenos.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Base de datos:** PostgreSQL + Prisma ORM
- **IA:** Claude API (Anthropic) — modelo `claude-sonnet-4-6`
- **Estilos:** Tailwind CSS
- **Deploy:** Railway (auto-deploy en cada push a `master`)

## Funcionalidades

- Perfil personalizado: objetivo, alergias, preferencias, número de personas
- Generación de menú semanal (7 días × 3 comidas) con Claude IA
- Fallback automático si Claude no está disponible — nunca devuelve error al usuario
- Lista de compras consolidada, agrupada por categoría
- Checkboxes interactivos con barra de progreso
- Comparador de precios Lider vs Jumbo (CLP) integrado en la lista de compras
- Rate limiting: máximo 5 generaciones de menú por usuario por día
- Sesión por cookie (sin registro requerido)

## Estructura del proyecto

```
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                  # Dashboard principal
│   │   ├── menu/page.tsx             # Vista menú semanal
│   │   └── shopping-list/page.tsx    # Lista de compras
│   └── api/
│       ├── health/route.ts           # Healthcheck con query real a BD
│       ├── profile/route.ts
│       ├── menu/route.ts
│       ├── menu/generate/route.ts    # Generación con IA + rate limiting
│       ├── shopping-list/route.ts
│       └── prices/route.ts           # Comparador de precios (mock CLP)
├── components/
│   ├── Navigation.tsx
│   ├── ProfileForm.tsx
│   ├── MenuCard.tsx
│   └── ShoppingListView.tsx          # Lista + botón comparar precios
├── lib/
│   ├── db.ts                         # PrismaClient singleton
│   ├── session.ts                    # Gestión de sesión por cookie
│   ├── errors.ts                     # Helper apiError centralizado
│   ├── logger.ts                     # Logger JSON estructurado
│   ├── validators/profile.ts         # Validación Zod del perfil
│   ├── ai/claude.ts                  # Claude API + fallback estático
│   └── scrapers/
│       ├── lider.scraper.ts          # Stub — Fase 2
│       └── jumbo.scraper.ts          # Stub — Fase 2
├── services/
│   ├── profile.service.ts
│   ├── menu.service.ts               # Generación + historial + rate limit helper
│   ├── shopping-list.service.ts
│   └── price-comparator.service.ts  # Mock precios CLP + sustituciones
└── prisma/schema.prisma
```

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/pintoco/planificador.git
cd planificador

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Crear tablas en la base de datos
npx prisma db push

# 5. Iniciar en desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `ANTHROPIC_API_KEY` | API Key de Anthropic — obtener en [console.anthropic.com](https://console.anthropic.com) → API Keys |

> Si `ANTHROPIC_API_KEY` no está configurada o la cuenta no tiene crédito, la app usa un menú de plantilla básica como fallback (no falla con error).

## Deploy en Railway

### Primera vez

1. Crear proyecto en [Railway](https://railway.app)
2. **New Service → GitHub Repo** → seleccionar `pintoco/planificador`
3. **New Service → Database → PostgreSQL**
4. En el servicio de la app → Variables → agregar:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `ANTHROPIC_API_KEY` = `sk-ant-...`

### Auto-deploy

Cada `git push` a `master` dispara automáticamente:

```
build: npm install && prisma generate && next build
start: prisma db push --accept-data-loss && npm start
```

> Se usa `db push` (no `migrate deploy`) porque el proyecto no tiene archivos de migración. Sincroniza el schema directamente con la base de datos.

### Comandos útiles

```bash
railway variables   # Ver variables de entorno
railway logs        # Ver logs en tiempo real
railway open        # Abrir la app desplegada
```

## API Routes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Healthcheck — verifica conexión real a BD |
| `GET` | `/api/profile` | Obtener perfil del usuario |
| `POST` | `/api/profile` | Guardar/actualizar perfil (valida con Zod) |
| `GET` | `/api/menu` | Obtener menú activo |
| `POST` | `/api/menu/generate` | Generar menú con IA (límite: 5/día, 429 al exceder) |
| `GET` | `/api/shopping-list` | Obtener lista de compras |
| `GET` | `/api/prices?items=arroz,pollo` | Comparar precios en CLP (Lider vs Jumbo) |

## Modelos de base de datos

```prisma
User          # Identificado por sessionId (cookie)
Profile       # Objetivo, alergias, preferencias, personas
WeeklyMenu    # Menú JSON generado por IA — campo activo para historial
ShoppingList  # Lista de compras JSON por categorías, 1:1 con WeeklyMenu
```

## Características de producción

- **Healthcheck real** — `/api/health` ejecuta `SELECT 1` contra la BD
- **Fallback de IA** — si Claude falla, genera menú básico sin interrumpir al usuario
- **Rate limiting** — máximo 5 menús/día por usuario (HTTP 429 con mensaje claro)
- **Validación Zod** — entradas del perfil validadas en el servidor antes de tocar la BD
- **Sesión centralizada** — `lib/session.ts` como único punto de acceso a la cookie
- **Logger estructurado** — `lib/logger.ts` emite JSON por línea, visible en Railway Logs
- **Errores seguros** — 5xx devuelven mensajes genéricos, 4xx devuelven el detalle real
- **UI resiliente** — el comparador de precios maneja errores sin crashear

## Roadmap

- [x] Perfil de usuario
- [x] Generación de menú con Claude IA
- [x] Lista de compras automática
- [x] Deploy automático en Railway
- [x] Healthcheck con verificación de BD
- [x] Fallback cuando Claude no está disponible
- [x] Validación de entradas con Zod
- [x] Rate limiting (5 menús/día)
- [x] Logger estructurado
- [x] Comparador de precios mock (Lider / Jumbo CLP)
- [ ] **Fase 2:** Scraping real de precios (Lider / Jumbo Chile)
- [ ] Cache de precios en BD (TTL 1h)
- [ ] Sugerencias de sustitución de productos
- [ ] Exportar lista de compras a PDF
- [ ] Historial visual de menús anteriores
