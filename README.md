# 🥗 Planificador Inteligente de Alimentación

Aplicación web que genera menús semanales personalizados con IA y listas de compras automáticas.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Base de datos:** PostgreSQL + Prisma ORM
- **IA:** Claude API (Anthropic)
- **Estilos:** Tailwind CSS
- **Deploy:** Railway (auto-deploy en cada push)

## Funcionalidades

- Perfil personalizado: objetivo, alergias, preferencias, número de personas
- Generación de menú semanal (7 días × 3 comidas) con Claude IA
- Lista de compras consolidada, agrupada por categoría
- Checkboxes interactivos con barra de progreso
- Sesión por cookie (sin registro requerido)

## Estructura del proyecto

```
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── menu/page.tsx         # Vista menú semanal
│   │   └── shopping-list/page.tsx
│   └── api/
│       ├── profile/route.ts
│       ├── menu/route.ts
│       ├── menu/generate/route.ts
│       └── shopping-list/route.ts
├── components/
│   ├── Navigation.tsx
│   ├── ProfileForm.tsx
│   ├── MenuCard.tsx
│   └── ShoppingListView.tsx
├── lib/
│   ├── db.ts                     # PrismaClient singleton
│   └── ai/claude.ts              # Integración Claude API
├── services/
│   ├── profile.service.ts
│   ├── menu.service.ts
│   ├── shopping-list.service.ts
│   └── price-comparator.service.ts  # Fase 2 (stub)
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
| `ANTHROPIC_API_KEY` | API Key de Anthropic (Claude) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la aplicación |

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
start: prisma migrate deploy && npm start
```

### Comandos útiles

```bash
# Ver variables de entorno en Railway
railway variables

# Ver logs en tiempo real
railway logs

# Abrir la app desplegada
railway open
```

## API Routes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/profile` | Obtener perfil del usuario |
| `POST` | `/api/profile` | Guardar/actualizar perfil |
| `GET` | `/api/menu` | Obtener menú activo |
| `POST` | `/api/menu/generate` | Generar menú con IA |
| `GET` | `/api/shopping-list` | Obtener lista de compras |
| `GET` | `/api/health` | Healthcheck |

## Modelos de base de datos

```prisma
User          # Sesión por cookie
Profile       # Objetivo, alergias, preferencias, personas
WeeklyMenu    # Menú JSON generado por IA
ShoppingList  # Lista de compras JSON por categorías
```

## Roadmap

- [x] Perfil de usuario
- [x] Generación de menú con Claude IA
- [x] Lista de compras automática
- [x] Deploy automático en Railway
- [ ] **Fase 2:** Comparador de precios (Lider / Jumbo Chile)
- [ ] Exportar lista de compras a PDF
- [ ] Historial de menús anteriores
