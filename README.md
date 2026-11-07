<p align="center">
  <img src="frontend/public/marca/logo-habbi-lema.png" alt="Habbi" width="260" />
</p>

# 🏡 Habbi — Portal inmobiliario de Melipilla

Portal inmobiliario full stack para **Melipilla y alrededores**: casas, parcelas, terrenos y locales en venta y arriendo, con **contacto directo por WhatsApp** desde la ficha. Corredoras, inmobiliarias y dueños publican desde su propio panel, y el equipo **modera** cada aviso antes de que aparezca en el catálogo.

> **Por qué existe:** el líder del mercado prohíbe poner WhatsApp o teléfono en la ficha y obliga a usar su chat interno para quedarse con el lead. Habbi ofrece contacto directo desde el primer día.

[![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Angular](https://img.shields.io/badge/Angular-22_SSR-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![CI](https://github.com/MarcoAndresSilva/MarketPropiedades/actions/workflows/ci.yml/badge.svg)](https://github.com/MarcoAndresSilva/MarketPropiedades/actions/workflows/ci.yml)

---

## 🚀 Demo en vivo

- **Sitio (Render):** [market-propiedades-frontend.onrender.com](https://market-propiedades-frontend.onrender.com)
- **API (Render):** `https://market-propiedades-api.onrender.com`

> El sitio y la API corren en el plan gratuito de Render: la primera visita después de un rato sin uso puede tardar hasta un minuto en despertar el servicio (cold start).

---

## ✨ Funcionalidades

### Para quien busca

- **Catálogo con buscador real:** pestañas Comprar / Arrendar / Proyectos, más filtros por comuna, tipo de propiedad y rango de precio, todo resuelto en el backend.
- **Precios en UF y en pesos:** cada propiedad se publica en su moneda y muestra el equivalente con la **UF del día** (mindicador.cl), sin perder el filtro por rango.
- **Ficha completa:** galería de fotos, video, mapa (Leaflet + OpenStreetMap), botón de WhatsApp directo y formulario de consulta que avisa por correo al anunciante.
- **Favoritos sin cuenta:** se guardan en el navegador; quien busca no necesita registrarse.
- **Proyectos:** desarrollos inmobiliarios futuros de las corredoras de la zona.

### Para quien publica

- **Registro de anunciantes** (propietario, corredora o inmobiliaria) con **verificación de correo** y **recuperación de contraseña** usando tokens de un solo uso.
- **Panel del anunciante** (`/mi-cuenta`): crear y editar propiedades, subir fotos y video directo a Cloudinary (el backend solo firma la subida) y gestionar el ciclo de vida del aviso.
- **Moderación:** el aviso pasa por `Borrador → En revisión → Publicada / Rechazada (con motivo)`. Editar una propiedad ya aprobada la devuelve a revisión, para que la moderación no se pueda saltar.

### Para el equipo

- **Panel de administración:** CRUD de propiedades, proyectos y cuentas, **cola de revisión** para aprobar o rechazar avisos (con aviso por correo al anunciante), bandeja de consultas y métricas de visitas y contactos.

### Transversal

- **SSR con Angular** e hidratación, para que cada ficha llegue indexable a Google.
- **SEO:** meta tags por página, JSON-LD de cada propiedad, `robots.txt` y `sitemap.xml` dinámico.
- **Tema claro / oscuro**, diseño mobile-first, skip-link y diálogos nativos accesibles.
- **Lighthouse en CI** sobre el build de producción con SSR.

---

## 🛠️ Stack tecnológico

| Área              | Tecnología                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Backend**       | NestJS 12, Prisma 7 (adapter `pg`), PostgreSQL, Passport JWT + argon2, class-validator, Throttler    |
| **Frontend**      | Angular 22 con SSR (standalone, signals, control flow `@if`/`@for`), RxJS, SCSS, Leaflet             |
| **Servicios**     | Cloudinary (fotos y video), Resend (correos), mindicador.cl (valor de la UF)                        |
| **Calidad**       | Vitest (back y front), oxlint, ESLint (angular-eslint), Lighthouse CI, GitHub Actions               |
| **Infraestructura** | Render (API y sitio SSR), Neon (PostgreSQL), Docker Compose para la base local                    |

---

## 🏗️ Documentación de arquitectura

Todo el proyecto está documentado fase por fase en **[ARCHITECTURE.md](./ARCHITECTURE.md)**: qué se construyó, cómo, qué alternativas se descartaron y por qué. Incluye bugs reales que solo aparecieron en producción, por ejemplo:

- Leaflet funcionaba en `ng serve` pero reventaba en el bundle de producción por la interop CommonJS/ESM.
- Netlify publicaba el sitio sin SSR porque `server.ts` no era el del scaffold.
- Un token de un solo uso se consumía dos veces por culpa del SSR más la hidratación.

---

## 📂 Estructura del proyecto

```
MarketPropiedades/
├── backend/                 # API NestJS + Prisma
│   ├── prisma/              # schema.prisma, migraciones y seeds (regiones/comunas, admin, demo)
│   └── src/
│       ├── auth/            # JWT, roles (@SoloAdmin / @SoloAnunciante), registro, tokens de cuenta
│       ├── properties/      # catálogo, panel del anunciante (/mis-propiedades), moderación
│       ├── proyectos/       # proyectos inmobiliarios
│       ├── consultas/       # contacto desde la ficha
│       ├── metricas/        # visitas y contactos por propiedad
│       ├── uploads/         # firma de subidas a Cloudinary
│       ├── indicadores/     # UF del día
│       ├── mail/            # Resend + plantillas de correo
│       └── locations/ users/ prisma/
├── frontend/                # Angular 22 con SSR
│   └── src/app/
│       ├── core/            # servicios, guards, interceptor, modelos
│       ├── features/        # home, catálogo, ficha, proyectos, favoritos, cuenta, publicar, servicios
│       ├── admin/           # panel de administración
│       ├── shared/          # formulario de propiedad compartido por admin y anunciante
│       └── layout/          # header, footer, logo
├── .github/workflows/ci.yml # build, lint, tests y Lighthouse
├── docker-compose.yml       # PostgreSQL 17 local
└── ARCHITECTURE.md
```

---

## 🖥️ Cómo empezar (setup local)

### Requisitos

- [Node.js](https://nodejs.org/) 22 (versión exacta en `.nvmrc`; con nvm: `nvm use`)
- [Docker](https://www.docker.com/) para la base de datos

### 1. Clonar y levantar PostgreSQL

```bash
git clone https://github.com/MarcoAndresSilva/MarketPropiedades.git
cd MarketPropiedades
docker compose up -d        # PostgreSQL en localhost:5434
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # los valores por defecto ya apuntan al Postgres de docker-compose
npx prisma migrate dev      # crea las tablas
npm run seed                # 16 regiones y 346 comunas de Chile
npm run seed:admin          # cuenta admin con ADMIN_EMAIL / ADMIN_PASSWORD del .env
npm run seed:demo           # opcional: propiedades de demostración
npm run start:dev
```

La API queda en `http://localhost:3002`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

El sitio queda en `http://localhost:4202`. El panel de administración está en `/admin/login`.

---

## 🔑 Variables de entorno

**`backend/.env`** (plantilla completa y comentada en [`backend/.env.example`](./backend/.env.example))

```env
DATABASE_URL="postgresql://market:market@localhost:5434/market_propiedades?schema=public"
DIRECT_URL="..."              # conexión directa para migraciones (en Neon, sin pooler)
PORT=3002
FRONTEND_URL="http://localhost:4202"   # orígenes de CORS, separados por coma
JWT_SECRET="un-secreto-largo-y-aleatorio"

ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME    # los usa seed:admin
CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET

APP_URL="http://localhost:4202"   # base de los links que van en los correos
RESEND_API_KEY=""                 # vacío = el correo se escribe en el log en vez de enviarse
MAIL_FROM="Habbi <onboarding@resend.dev>"
```

> Sin `RESEND_API_KEY`, todo el flujo de verificación y recuperación se puede probar en local: el link aparece en la consola del backend.

**`frontend/src/environments/`**: `apiUrl`, `siteUrl` y `cloudinaryCloudName` para desarrollo, producción y CI.

---

## 🔒 Autenticación y roles

- JWT firmado con expiración de 8 horas; las contraseñas se guardan con **argon2**.
- Un mismo login para el admin y los anunciantes; el rol lo decide la API con `RolesGuard` en cada endpoint, no el frontend.
- Cambiar la contraseña invalida las sesiones abiertas con la anterior.
- Los tokens de verificación y recuperación se guardan como hash SHA-256 y se consumen de forma atómica, así que cada link sirve una sola vez.
- Rate limiting en login, registro y reenvío de correos.

Rutas públicas principales: catálogo (`GET /properties`), ficha, proyectos, consultas, `POST /auth/login`, `POST /auth/registro` y los flujos de verificación y recuperación. El resto requiere `Authorization: Bearer <token>` y el rol correspondiente.

---

## 🧪 Tests y calidad

```bash
# Backend
cd backend
npm test            # unit tests (Vitest)
npm run test:e2e    # e2e
npm run lint        # oxlint

# Frontend
cd frontend
npm test            # Vitest
npm run lint        # ESLint
```

GitHub Actions corre build, lint y tests de ambos proyectos en cada push y pull request a `main`, y además **Lighthouse CI** contra el servidor SSR compilado.

---

## 👤 Autor

**Marco Silva** — [GitHub @MarcoAndresSilva](https://github.com/MarcoAndresSilva)
