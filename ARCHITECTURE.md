# ARCHITECTURE.md — Market Propiedades

> Diario de arquitectura y decisiones técnicas: qué se construyó en cada fase, cómo, y por qué se
> eligió cada camino. Este documento **no** dice en qué fase está el proyecto hoy ni qué falta —
> eso es información de trabajo entre Marco y el asistente, no algo que deba vivir en el repo.

## 1. Qué es esto y por qué

**Market Propiedades** (`marketpropiedades.cl`) es un portal inmobiliario para Melipilla — una
plataforma tipo galería donde se publican propiedades (casas, parcelas, terrenos, locales
comerciales) para **venta y arriendo**. Cada publicación tiene fotos, video, descripción y contacto
directo por WhatsApp, más un botón de "Agendar visita". El negocio se sostiene con paquetes pagados
(posición destacada, generación de contenido, campañas de Meta Ads) y una comisión por venta
cerrada a través de la plataforma.

**Diferenciación real, no cosmética:** el líder del mercado (PortalInmobiliario/MercadoLibre)
prohíbe poner WhatsApp o teléfono en la ficha y obliga a usar su chat interno para no perder el
lead. Market Propiedades ofrece contacto directo desde el día uno.

**Decisiones de alcance tomadas al inicio, no se reabren sin motivo:**
- **MVP curado, no autoservicio:** las propiedades se cargan desde un panel de administración, no
  hay registro público para corredoras ni dueños todavía. Así se valida que el negocio funciona
  antes de construir el sistema de cuentas multi-publicador.
- **El modelo de `User` deja espacio para roles futuros** (persona natural / agente de corredora /
  admin) y **la ubicación se modela como región + comuna**, no hardcodeada a Melipilla — para no
  tener que rehacer el schema si el negocio decide abrir registro público o expandirse a otras
  comunas más adelante.
- **Pasarela de pago real desde el MVP** (Mercado Pago) — a diferencia de Imperio Barber, donde se
  decidió explícitamente no construir pagos porque no eran el negocio. Acá los paquetes pagados son
  el corazón del modelo de negocio.
- **IA como parte del MVP, no fase 2:** generación de borrador de descripción de propiedad y
  traducción de búsqueda en lenguaje natural a filtros estructurados, ambas vía API (Anthropic),
  sin infraestructura propia.
- **Fuera del MVP, a propósito:** simulador de crédito hipotecario / tasación automática, tours
  virtuales 360°/VR, alertas de búsqueda guardada + recomendaciones con IA, comparador de
  propiedades. Todos requieren datos o volumen que la plataforma no va a tener al lanzar.
- Stack: **NestJS 12 (CommonJS) + TypeScript + PostgreSQL + Prisma 7** (backend), **Angular 22 con
  SSR** (frontend), desplegado en **Netlify** (frontend), **Render** (API), **Neon** (base) y
  **Cloudinary** (fotos/video) — mismo trío de hosting que Imperio Barber.

---

## 2. Diario de decisiones técnicas

### Elección de stack

**Decisión — se mantiene el backend de Imperio Barber (NestJS + TypeScript + PostgreSQL +
Prisma), no se reinventa.** Ya está probado en producción y ningún requisito nuevo de este
proyecto lo hace insuficiente — la complejidad real de Market Propiedades está en el modelo de
negocio (multi-publicador, pagos, SEO), no en el framework backend.

**Decisión — NestJS 12 en CommonJS, no ESM.** Verificado contra el roadmap real de NestJS (no
contra un patrón de hace meses): v12 migró sus paquetes internos a ESM, pero el código de la
aplicación puede seguir en CommonJS sin ninguna pérdida de funcionalidad — migrar el propio código
es opcional, no un requisito de la versión. Se evaluó ESM y se descartó para este proyecto: obliga
a cambios reales de sintaxis (extensión `.js` en imports, sin `__dirname`), aumenta el riesgo de
toparse con una librería del ecosistema (ej. el SDK de Mercado Pago) sin build ESM real todavía, y
el toolchain nuevo de v12 (Vitest/oxlint/Rspack) tiene semanas de vida. CJS da el framework nuevo
sin absorber ese riesgo.

**Decisión — Prisma 7, no Prisma 8.** Al momento de esta decisión, Prisma 8 es todavía release
candidate (GA recién esperado en octubre) — se descarta para un proyecto real hasta que sea
estable. Prisma 7 mantiene el patrón ya conocido de Imperio Barber: driver adapter explícito
(`@prisma/adapter-pg`), configuración en `prisma7.config.ts` (la CLI 7.10.0 versiona el nombre del
archivo para convivir con la migración a v8), dos connection strings (pooled para runtime, directa
para migraciones). Igual que en Imperio Barber, el generador de Prisma 7 emite ESM
por defecto — hay que forzar `moduleFormat = "cjs"` en el `generator client` del schema para que
coincida con el resto del backend en CommonJS.

**Decisión — frontend en Angular 22 con SSR, no Next.js/React.** Verificado que tanto SSR como
hydration incremental están production-ready en Angular 22, no es apostar a una feature
experimental. A diferencia de Imperio Barber (Angular standalone sin SSR — una sola landing no
necesitaba indexar nada), acá cada ficha de propiedad es una oportunidad de tráfico orgánico real y
necesita ser indexable por Google. Se evaluó cambiar a Next.js por tener un ecosistema de SSR más
maduro, pero se descartó: implicaría aprender un framework nuevo sin necesidad real, cuando Angular
ya cubre el requisito con la experiencia ya construida en Imperio Barber.

**Decisión — se mantiene el hosting de Imperio Barber (Netlify + Render + Neon + Cloudinary).**
Verificado que Netlify tiene soporte día-uno para Angular 22 con SSR — no hace falta migrar de
proveedor de frontend solo porque ahora hay server-rendering.

**Decisión — mapa con Leaflet + OpenStreetMap, no Google Maps.** Gratis y sin tarjeta de crédito
desde el día uno, coherente con un proyecto que recién arranca sin ingresos reales todavía. Queda
pendiente de definir el servicio de geocodificación (dirección → lat/lng) que lo acompaña — no
bloquea el resto del modelo de datos.

**Decisión — IA vía API de Anthropic (Claude Haiku 4.5), sin infraestructura propia.** Costo por
token marginal para el volumen esperado (fichas de cientos de palabras, no miles de llamadas por
segundo). La suscripción de Claude.ai (chat) es un producto distinto y no da acceso a la API — hace
falta una cuenta separada en la consola de Anthropic, facturada por token consumido. Dos usos
definidos: generación de borrador de descripción de propiedad a partir de datos estructurados
(tipo, m², dormitorios, ubicación), y traducción de búsqueda en lenguaje natural a los mismos
filtros estructurados que de todos modos existen en la UI (comuna, tipo, precio, dormitorios).

### Fase 1 — Scaffold del repo

**Bug encontrado — npm 10.9.8 (la que trae Node 22.23.1 de fábrica) no instala nada:** falla con
`TypeError: Cannot read properties of null (reading 'edgesOut')` al resolver el peer dependency
opcional `@vitest/browser-playwright` de Vitest 4 — un bug real del arborist de esa versión de npm,
no algo del proyecto. Con npm 10.8.2 (la de Node 20) no pasa. Fix: `npm install -g npm@latest`
(quedó en 12.0.2) antes de instalar dependencias en este proyecto.

**Decisión — se saca `@nestjs/mau` del scaffold generado por `nest new`:** es la CLI de deploy a la
nube propia de NestJS; no la usamos porque el backend se despliega a Render. Arrastraba
`inquirer`/`undici` viejos con 5 vulnerabilidades (2 altas). Sacarla del `package.json` resuelve
las 5 de una, sin recurrir a `npm audit fix --force` (que hubiese bajado `@nestjs/mau` a una
versión vieja igual de innecesaria).

**Descubrimiento — npm 12 bloquea scripts de instalación por defecto:** `prisma` y
`@prisma/engines` necesitan su `postinstall`/`preinstall` para bajar el motor de conexión, y npm
12 los bloquea salvo aprobación explícita (`npm install-scripts approve <pkg>`, que registra un
campo `allowScripts` en `package.json`). Quedan aprobados y versionados en el repo — cualquiera que
clone e instale con ese `package.json` no vuelve a pedir aprobación.

**Bug encontrado — `moduleResolution: "node"` rompe el build con TypeScript 6:** TS 6 trata ese
valor (alias de `node10`) como error de deprecación, no advertencia. Con `"module": "commonjs"` no
hace falta declarar `moduleResolution` explícito — TypeScript infiere el modo clásico correcto sin
disparar el error. Se eliminó la línea del `tsconfig.json` del backend.

**Descubrimiento — Angular 22 SSR valida la cabecera `Host` contra una lista blanca
(CVE-2026-27739):** es un hardening real contra SSRF/header injection, no un bug del scaffold. En
local hace falta `NG_ALLOWED_HOSTS=localhost` para levantar el server de SSR; en producción (detrás
de Netlify) habrá que setear el dominio real (`marketpropiedades.cl`) como variable de entorno
cuando se despliegue.

**Verificado end-to-end:** backend (NestJS 12 CJS + `ConfigModule` + `PrismaService` con
`@prisma/adapter-pg`) conecta contra Postgres real en Docker (puerto `5434`), responde con CORS
correcto usando `ConfigService` (no `process.env` directo, para no repetir el bug de CORS de
Imperio Barber) — build, lint y tests (Vitest) limpios. Frontend (Angular 22 + SSR) build y server
de SSR probado sirviendo HTML ya renderizado. Puertos de este proyecto (`3002`/`4202`/`5434`)
elegidos para no chocar con Imperio Barber (`3001`/`4201`/`5433`) si corren ambos a la vez.

### Fase 2 — Modelo de datos base

**Decisión — `Region`/`Comuna` como tablas normalizadas sembradas con datos oficiales, no
hardcodeadas a Melipilla.** El catálogo completo (16 regiones, 346 comunas, con el código oficial
SUBDERE de 5 dígitos como `id` de cada comuna) se siembra vía `prisma/seed.ts` desde
`prisma/seed-data/regiones-comunas.json`. `Property.comunaId` referencia esta tabla — el negocio
puede operar en cualquier comuna del país sin tocar el schema, aunque el lanzamiento sea solo
Melipilla. Fuente: dataset público (`jromerof/regiones-chile`), no inventado.

**Bug encontrado en la fuente de datos — Huasco (Atacama) tenía el mismo código que Copiapó
(`03101`):** el dataset de terceros traía ese error. Verificado contra la estructura real de
códigos SUBDERE (provincia de Huasco = `0330x`) y corregido a `03304` antes de sembrar — se
detectó porque el código se usa como `@id`, y un duplicado habría roto el seed o pisado datos.

**Decisión (revisada en Fase 3) — contacto (dueño o corredora) directo en `Property`, no una
entidad `Publicador` aparte.** El MVP es curado (nadie se registra todavía, ver §1) — modelar un
publicador con cuentas y permisos sería construir para un caso de uso que no existe aún.
`contactoTipo` + `contactoNombre` + `contactoWhatsapp` alcanzaban para mostrar quién atiende y armar
el link `wa.me`. Quedó pendiente de definir con el socio si una cuenta de corredora admite varios
agentes — resuelto en Fase 3, que reemplaza este enfoque.

**Decisión — `Role` en `User` ya incluye `PERSONA`/`CORREDORA` además de `ADMIN`, aunque ningún
flujo de registro los use todavía.** Es la extensibilidad que ya se había decidido en la elección de
stack (§1) — declarar el valor del enum no construye registro ni permisos por rol, que sigue sin
existir hasta que haya cuentas de publicador de verdad.

**Decisión — precio en `Decimal` para UF, `Int` para CLP.** Sigue la convención chilena ya
documentada (venta en UF, arriendo en CLP): UF se transa con decimales (`@db.Decimal(12, 2)`), CLP
no tiene fracciones. `gastosComunesClp` también como `Int`.

**Verificado:** migración aplicada contra Postgres real, seed corrido (346 comunas cargadas,
confirmado con una consulta SQL directa — incluye el fix de Huasco), build/lint/test siguen limpios
tras el cambio de schema.

### Fase 3 — Cuentas de publicador (persona natural / corredora)

**Decisión — `Property` pasa a pertenecer a una cuenta `User` (`publicadorId`), reemplazando los
campos sueltos de contacto de Fase 2.** Confirmado con el socio: una corredora es **una cuenta por
agencia**, no una por agente individual — sus agentes suben material bajo esa misma cuenta, guiados
por quien la administra. Con eso resuelto, tiene más sentido que el contacto de la ficha (nombre,
WhatsApp) viva en la cuenta del publicador (`User.name`/`User.whatsapp`) y no repetido en cada
propiedad — evita datos duplicados si una corredora publica varias fichas. `TipoContacto` se elimina
del todo: el tipo de contacto ya es `User.role` (`PERSONA` o `CORREDORA`).

**Decisión — `CorredoraProfile` como perfil 1:1 aparte de `User`, no campos sueltos en `User`.**
Solo una corredora necesita razón social y RUT; una persona natural no. Separarlo evita llenar
`User` de columnas que solo aplican a un tipo de cuenta.

**Nota de alcance — el registro público de publicadores sigue sin existir.** Esto es el modelo de
datos preparado para cuando exista (admin sigue creando las cuentas a mano durante el MVP curado,
como ya estaba decidido en §1) — construir el flujo de registro/login para personas y corredoras es
trabajo aparte, todavía no hecho.

**Verificado:** migración generada con `prisma migrate diff` (el modo interactivo de `migrate dev`
no corre en este entorno) y aplicada con `prisma migrate deploy` — segura porque las tablas
afectadas estaban vacías. Prueba end-to-end contra Postgres real: creada una cuenta `CORREDORA` con
su `CorredoraProfile`, una `Property` en Melipilla apuntando a esa cuenta, verificada la relación
completa (publicador + comuna) y limpiada sin dejar residuos. Build, lint y test siguen limpios.

### Fase 4 — Autenticación del panel (JWT + argon2)

**Decisión — mismo patrón que Imperio Barber: `JwtStrategy` revalida contra la base en cada
request.** El JWT solo prueba que en algún momento se hizo login — no confirma que la cuenta siga
existiendo. `JwtStrategy.validate()` busca el usuario por `id` en cada request autenticada; si fue
borrado, el token deja de servir aunque no haya expirado. Costo: una consulta extra por request
autenticada — aceptable frente a la alternativa (confiar ciegamente en el payload del token).

**Bug real encontrado — `PassportModule` sin `.register()` rompe en NestJS 12:** `AuthGuard('jwt')`
depende de inyectar `AuthModuleOptions`, marcada `@Optional()` tanto a nivel de constructor como de
propiedad en el código de `@nestjs/passport`. En versiones anteriores de Nest, si `PassportModule` se
importaba "pelado" (sin `.register()`, que es lo único que efectivamente provee `AuthModuleOptions`),
esa dependencia opcional simplemente quedaba `undefined` sin problema. En NestJS 12, la resolución de
metadata `@Optional()` sobre la clase mixin dinámica que genera `AuthGuard()` falla y tira
`UnknownDependenciesException` en el arranque — un cambio de comportamiento real entre versiones, no
un error de configuración. Fix: `PassportModule.register({ defaultStrategy: 'jwt' })` en vez de
`PassportModule` a secas — la forma explícita, que además es la recomendada en la documentación de
`@nestjs/passport`, nunca dependió de esa resolución opcional.

**Decisión — `@nestjs/throttler` sí se usa, pese al warning de `peerDependencies`.** La versión
publicada (6.5.0) todavía declara soporte solo hasta `@nestjs/common@^11` — no es que sea
incompatible con v12, es que el paquete no bumpeó su `package.json` todavía (usa únicamente API
pública y estable de Nest: `CanActivate`, `ExecutionContext`, `Reflector`). Se instaló con
`legacy-peer-deps=true` (persistido en `backend/.npmrc`, no solo en la sesión) después de **verificar
en runtime** — no solo que compilara — que el guard bloquea de verdad: 6 intentos seguidos a
`/auth/login` devuelven `401,401,401,429,429,429`, exactamente el límite de 5/min configurado.
Rechazar la librería por el warning sin probarla hubiese sido quedarse con la opción peor
(sin rate-limiting en el login) por una incompatibilidad que no era real.

**Implementación:** `POST /auth/login` (JWT HS256, expira a las 8h) + `argon2` para hashear
contraseñas; límite de 5 intentos/min por IP en login (por encima del límite global de 60/min de
todo el resto de la API). `GET /auth/me` protegido con `JwtAuthGuard`, devuelve el usuario desde
`@CurrentUser()`. `prisma/seed-admin.ts` crea/actualiza la cuenta `ADMIN` desde `ADMIN_EMAIL`/
`ADMIN_PASSWORD`/`ADMIN_NAME` del entorno — idempotente, mismo patrón que Imperio Barber.

**Verificado:** build/lint/test limpios; servidor levantado contra Postgres real; login con
credenciales correctas devuelve JWT válido, `/auth/me` con ese token devuelve el usuario, login con
password incorrecta devuelve 401, `/auth/me` sin token devuelve 401, y el rate-limit de
`/auth/login` corta al 6º intento en la ventana de 60s — probado con requests reales, no asumido.
