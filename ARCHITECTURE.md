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

### Fase 5 — CRUD de propiedades y cuentas de publicador

**Decisión — módulo `Users` mínimo, solo para que el CRUD de propiedades sea probable.**
`Property.publicadorId` es obligatorio desde Fase 3, pero no existía ninguna forma de crear una
cuenta `PERSONA`/`CORREDORA` más allá del seed del admin. `POST /users` / `GET /users` (protegidos,
sin login propio para el publicador todavía — sigue siendo MVP curado) alcanzan para eso. No es un
sistema de gestión de publicadores, es la pieza mínima necesaria para que el resto funcione.

**Decisión — catálogo público y panel de administración comparten controller, separados por
guard.** `GET /properties` y `GET /properties/:slug` son públicos y **siempre** filtran por
`estado: PUBLICADA` — no hay forma de pedir un borrador ajeno por la API pública. `GET
/properties/admin/all`, `POST`, `PATCH` y `DELETE` exigen `JwtAuthGuard`. Un solo controller en vez
de dos porque todas las operaciones son sobre el mismo recurso; la separación real es el guard, no
el archivo.

**Decisión — el slug se genera una vez al crear y nunca se toca en el update.** Formato
`tipo-comuna-sufijoAleatorio` (ej. `casa-melipilla-b64fvj`). Cambiar el slug en una edición
rompería cualquier link o posición en Google ya indexada — la URL de una ficha es, a efectos
prácticos, su identidad pública.

**Bug real encontrado — borrar un `User` con `CorredoraProfile` fallaba por FK.** La relación
`CorredoraProfile.user` no tenía `onDelete: Cascade` — intentar borrar una cuenta de corredora
tiraba una violación de foreign key en vez de borrarse. Se detectó limpiando datos de prueba a
mano, no con un test escrito para eso. Fix: `onDelete: Cascade` en esa relación específica — un
perfil de corredora no tiene sentido sin su cuenta, a diferencia de `Property.publicador`, que
deliberadamente **no** es cascade (borrar una cuenta no debería poder borrar de arrastre las fichas
publicadas de un negocio real).

**Verificado end-to-end contra Postgres real:** login → crear corredora → crear propiedad (queda
`BORRADOR`, invisible en `/properties` y 404 en `/properties/:slug`) → `PATCH estado=PUBLICADA` →
aparece de inmediato en el catálogo público y en la ficha por slug → `DELETE` la borra. Guards
verificados: `/properties/admin/all` y `POST /properties` devuelven 401 sin token. Cascade de
`CorredoraProfile` verificado con un insert/delete manual. Build, lint y test limpios.

### Fase 6 — Subida de fotos/video (firma de Cloudinary)

**Decisión — el backend firma, el archivo nunca lo toca.** Mismo patrón que Imperio Barber:
`POST /uploads/signature` (protegido) devuelve `{ cloudName, apiKey, timestamp, folder, signature }`
calculado con `crypto` nativo de Node (`sha1` de los parámetros ordenados + el secreto) — cero
dependencias nuevas, no hace falta el SDK de Cloudinary para esto. El navegador usa esos datos para
subir directo a la API de Cloudinary; el backend nunca recibe el binario, solo el resultado
(`cloudinaryPublicId`) que después se asocia a la propiedad vía `POST /properties/:id/fotos`.

**Decisión — asociar la foto es un endpoint aparte de crear la propiedad.** El flujo real de un
formulario de carga es: crear la propiedad primero (o tenerla ya creada), subir cada foto a
Cloudinary por separado, y por cada una avisarle al backend con `cloudinaryPublicId` + `orden`. No
tiene sentido mandar todas las fotos en el mismo `POST` que crea la propiedad — el usuario puede
agregar o sacar fotos después, sin recrear la ficha entera.

**Verificado:** con credenciales de prueba en `.env` (no reales — falta crear la cuenta free de
Cloudinary), se pidió una firma real al endpoint y se **recalculó el mismo hash de forma
independiente** con `crypto` de Node fuera del código de la app, confirmando que el algoritmo es
exactamente el que exige Cloudinary (parámetros ordenados alfabéticamente, unidos con `&`, más el
secreto, todo en `sha1` hex). También probado el flujo completo de asociar y quitar una foto de una
propiedad real. Build, lint y test limpios.

### Fase 7 — Frontend: catálogo público y ficha de propiedad

**Decisión — `RenderMode.Server`, no `Prerender`, para todo el frontend.** El scaffold traía
`RenderMode.Prerender` por defecto (render único en build time). El catálogo depende de qué
propiedades están `PUBLICADA` en cada momento — prerenderizarlo congelaría el contenido hasta el
próximo deploy. Se cambia a SSR real por request; ISR/regeneración periódica queda para cuando el
volumen lo justifique.

**Decisión — `environments/` generado con el schematic oficial de Angular (`ng generate
environments`), no armado a mano.** `environment.ts` (producción) y `environment.development.ts`
(reemplaza al anterior en builds de desarrollo vía `fileReplacements` en `angular.json`) — ahí vive
`apiUrl` y `cloudinaryCloudName`. Ninguno de los dos es secreto: son valores públicos que de todas
formas terminan visibles en el bundle del navegador.

**Bug real / gotcha encontrado — `ng build` (sin flags) compila con la configuración de
producción por defecto**, no con la de desarrollo. Al probar el catálogo localmente contra el
backend de la máquina, el build tomó `environment.ts` (la URL de Render, que todavía no existe) en
vez de `environment.development.ts` (`localhost:3002`) — el fetch durante SSR devolvía 404 real
contra un dominio que no existe, no un error de código. Para probar en local: `ng build
--configuration development` (lo mismo que hace `ng serve` automáticamente).

**Decisión — `provideHttpClient(withFetch())`, no el cliente XHR por defecto.** La API Fetch nativa
de Node funciona igual en el servidor y en el navegador, evitando la dependencia de polyfills tipo
`xhr2` para las llamadas HTTP que se hacen durante SSR.

**Implementación:** `CatalogComponent` (lista + filtros por operación/tipo, consumiendo `GET
/properties`) y `PropertyDetailComponent` (`GET /properties/:slug`, con botones reales de
"Contactar por WhatsApp" y "Agendar visita" armados con `wa.me` — el diferenciador central del
producto). Precio formateado según la convención ya definida (UF para venta, CLP para arriendo).
Fotos servidas desde Cloudinary con transformación de recorte/calidad en la URL (`c_fill,q_auto,
f_auto`), sin backend propio de imágenes.

**Verificado end-to-end, no solo con datos de mentira:** propiedad real creada y publicada vía la
API, servida por el catálogo con SSR real (`curl` al HTML crudo antes de cualquier JS del
navegador: aparece "1 propiedad encontrada", "Melipilla", "UF 4.200"). Ficha de detalle verificada
igual, incluido el link `wa.me` con el número correcto del publicador. Estado "no encontrado"
probado con un slug inexistente. Build (desarrollo y producción) y test limpios.

### Fase 8 — Sistema de diseño: header y tema claro/oscuro

**Decisión — paleta terracota + verde, no el azul corporativo genérico.** Investigado contra
tendencias reales de portales inmobiliarios 2026 (no elegido a ojo): los sitios serios usan
acentos discretos para que la foto de la propiedad sea la protagonista, y el color de marca
comunica posicionamiento — navy/azul se lee como "corporación distante" (el molde de
PortalInmobiliario y similares), mientras que tonos cálidos ligados a lo local comunican
confianza/boutique. Terracota como acento único (CTAs, precios, destacados) + verde profundo
reservado para estados de éxito — coherente con el diferenciador real del producto (contacto
humano directo por WhatsApp, no un portal corporativo frío).

**Decisión — tipografía Fraunces (títulos) + Plus Jakarta Sans (cuerpo), no Inter.** Fraunces es
un serif moderno con calidez real (óptica variable, no un serif rígido de banco) para títulos y
precios; Plus Jakarta Sans para todo el resto — geométrica pero con terminaciones redondeadas, más
distintiva que la opción "seteo por defecto" del ecosistema.

**Decisión — mismo patrón técnico de tema del portafolio, pero *light-first*, no dark-first.** El
`ThemeService` (señal + `effect` que escribe `data-theme` en `<html>` y persiste en
`localStorage`) y el script anti-parpadeo inline en `index.html` son el mismo patrón ya probado.
La diferencia deliberada: acá se respeta `prefers-color-scheme` del sistema como default cuando
nadie eligió todavía, en vez de forzar oscuro — el portafolio es una pieza personal con público
técnico; esto es un portal de consumo masivo (compradores/arrendatarios de cualquier edad), no hay
motivo para pisar la preferencia que la persona ya configuró en su equipo.

**Verificado con capturas reales, no solo "compiló":** se instaló Chromium vía Playwright en el
scratchpad (reutilizando el binario ya cacheado, sin descarga nueva) y se sacó captura del
catálogo y la ficha de propiedad en ambos temas (`emulateMedia({ colorScheme })`), confirmando que
los tokens de color se aplican correctamente en toda la UI, no solo en el header.

### Fase 9 — Slider de fotos, video, y logo del header

**Decisión — pantalla aparte para el detalle (`/propiedad/:slug`), no modal.** Un modal no tiene
URL propia indexable — rompería el objetivo central de SSR (cada ficha como oportunidad de
tráfico orgánico). Una ruta real, con su propio `<title>`/meta tags (SEO, todavía pendiente), es insustituible
para ese objetivo; un modal es la elección correcta para una acción secundaria dentro de una
página, no para el contenido principal de una ficha.

**Decisión — slider de fotos construido a mano, sin librería.** `PhotoSliderComponent` (señal para
el índice actual, prev/next con wraparound, navegación por teclado con flechas) — la necesidad es
simple (recorrer un array de fotos) y no justifica una dependencia externa con su propio bundle y
API a aprender.

**Decisión — fotos de relleno como SVG estáticos propios, no fotos de internet ni Cloudinary
real.** `frontend/public/demo-fotos/*.svg` en vez de hotlinkear un servicio externo (que puede
caerse o cambiar) o pretender que son fotos reales de una propiedad. `cloudinaryImageUrl()` ahora
detecta si ya recibió una URL completa (empieza con `http` o `/`) y la deja pasar tal cual, en vez
de siempre armar la URL de transformación de Cloudinary — así el mismo helper sirve para relleno
local hoy y para Cloudinary real el día que exista la cuenta, sin tocar el resto del código.

**Decisión — video con `<video controls>` nativo, no un embed de YouTube/Vimeo.** El campo
`Property.videoUrl` está pensado para un archivo de video real subido a Cloudinary (mismo patrón
de firma que las fotos) — un `<video>` HTML5 apunta directo a esa URL sin intermediarios. Para
probarlo sin cuenta de Cloudinary todavía, el seed de demo usa un video de muestra público
(cortometraje libre de Blender Foundation) — deja claro en el código que es de prueba, no una
visita real.

**Verificado con interacción real, no solo visual:** captura de pantalla confirmando slider +
video renderizados: además, un click programático en el botón "siguiente" y lectura del contador
(`1 / 4` → `2 / 4`) confirma que la navegación realmente cambia de foto, no que solo se ve bien
estática.

### Fase 10 — Hero con carrusel en el catálogo

**Decisión — mensajes reales del negocio, no estadísticas inventadas.** Las tres tarjetas del
hero (contacto directo por WhatsApp, agendar visita, indexabilidad en Google) son beneficios ya
decididos y construidos del producto — no cifras de relleno tipo "+500 propiedades" que no existen
todavía. El diseño queda listo como infraestructura para que el equipo de marketing reemplace el
contenido por banners/fotos propias sin tocar el componente.

**Decisión — autoplay deshabilitado durante SSR.** `HeroCarouselComponent` solo arranca el
`setInterval` si `isPlatformBrowser` es verdadero — un timer corriendo en el servidor no tiene
ningún efecto útil (nadie ve la animación) y sería una fuga de recursos por cada request
renderizado. Se pausa además al pasar el mouse o el foco de teclado por encima, para no competir
con la lectura del texto.

**Decisión — indicadores (dots) fuera de la franja de color del slide, no superpuestos.** Cada
slide usa un tono de fondo distinto (acento, éxito, neutro) — puntos blancos semitransparentes
superpuestos se leerían bien sobre un fondo oscuro pero perderían contraste sobre el slide de tono
claro. Los dots viven en una franja aparte, sobre el fondo de la página, con colores de los tokens
de tema — contraste consistente sin importar qué slide esté activo.

**Decisión — el slide admite dos formas: tarjeta de texto o imagen completa.** `HeroSlide` es un
tipo discriminado por `kind` (`'valor' | 'banner'`). Los banners promocionales con ofertas
específicas (porcentajes de descuento, nombres de proyectos, precios) son piezas de marketing con
datos reales del negocio — no algo que se pueda generar en el código sin esa información real. La
variante `'banner'` deja el componente listo para recibir esas piezas como imagen completa (con un
link opcional) el día que existan, sin tener que rediseñar nada.

**Verificado con interacción real:** click programático en el tercer punto de navegación y lectura
del título del slide resultante, confirmando que cambia de contenido — no solo captura estática.
Probado en ambos temas.

### Fase 11 — Página explicativa del proceso de publicación

**Decisión — página propia (`/publicar`) en vez de un link directo a WhatsApp en el header.** Un
link "seco" abre WhatsApp sin contexto: quien llega ahí no sabe qué información traer ni qué pasa
después de escribir. La ruta `/publicar` explica el proceso real en tres pasos (escribir por
WhatsApp con los datos básicos → armar la ficha con fotos y descripción, con revisión del
publicador → quedar publicado y recibir contactos directo), cada uno con un ícono propio. El botón
de contacto queda al final, ya con el mensaje pre-armado (`buildWhatsappUrl` + la constante
centralizada en `core/business-contact.ts`, para poder cambiar el número en un solo lugar si el
negocio define un canal más formal más adelante).

**Decisión — los tres pasos describen el proceso curado real, no un formulario automático.**
Mientras no exista registro público de publicadores (§1), el flujo de verdad es manual: alguien
escribe, el equipo arma la ficha, se publica. Mostrar un formulario de varios pasos que pareciera
autogestionado sería fabricar un flujo que no existe — la página describe honestamente el proceso
tal cual funciona hoy. Si más adelante se construye un formulario público real, esta página es el
lugar natural para reemplazarlo.

**Verificado:** el `href` del botón final se leyó directamente del DOM renderizado, confirmando la
URL de `wa.me` con el número y el mensaje correctos. Probado en ambos temas y en viewport móvil.

### Fase 12 — Footer

**Decisión — footer con contenido real, sin fabricar redes sociales ni dirección.** El sitio
terminaba de golpe justo después de la grilla de propiedades, sin cierre visual ni landmarks de
accesibilidad (`<main>`/`<footer>`). El footer nuevo repite la marca, un texto breve real (qué es
el portal), navegación a las páginas que ya existen y el mismo contacto de WhatsApp centralizado en
`core/business-contact.ts`. No incluye íconos de redes sociales ni una dirección física — no
existen cuentas ni oficina real todavía, y un ícono de Instagram/Facebook sin cuenta detrás sería
fabricar presencia que no existe.

**Decisión — `<main>` explícito en cada página, incluida `/publicar`.** El catálogo y la ficha de
propiedad ya declaraban su propio `<main>`; `/publicar` usaba un `<section>` suelto. Se corrigió
para que las tres páginas compartan la misma estructura de landmarks (`header` → `main` → `footer`)
que usa cualquier lector de pantalla para navegar la página por regiones.

### Fase 13 — Filtro de comuna en el catálogo

**Decisión — `GET /properties/comunas` devuelve solo comunas con al menos una propiedad
publicada, no las 346 del país.** El modelo de datos es nacional a propósito (§1), pero el
catálogo real solo cubre Melipilla y su zona. Un dropdown con las 346 comunas del país para un
catálogo que cubre un puñado confundiría más de lo que ayuda — el filtro se llena con
`Comuna.findMany({ where: { properties: { some: { estado: PUBLICADA } } } })`, así que crece solo
a medida que el catálogo realmente cubre más comunas.

**Decisión — el seed de demo se amplió a 4 comunas reales, no solo Melipilla.** Con datos
únicamente en una comuna, el filtro nunca podía probarse de verdad — un `<select>` con una sola
opción no ejercita nada. Se agregaron 5 propiedades más en San Pedro, Talagante y El Monte
(comunas reales de la zona poniente de la Región Metropolitana, con sus códigos SUBDERE reales:
`13505`, `13601`, `13602`), para que el MVP se comporte como se comportaría en producción con
cobertura real en más de una comuna — no un mock que solo funciona en el caso de una sola comuna
sembrada.

**Decisión de ruteo — `GET /properties/comunas` se declara antes de `GET /properties/:slug`.**
Ambas son rutas de un solo segmento bajo `/properties`; si `:slug` se declarara primero, Nest
interpretaría cualquier request a `/properties/comunas` como una búsqueda de la ficha con slug
`"comunas"` y nunca llegaría al controller correcto. `GET /properties/admin/all` no tiene este
problema porque son dos segmentos, no uno.

**Decisión — el filtro de comuna no se muestra si la lista viene vacía.** Si `findComunasConPropiedades()` no devuelve nada (o falla la request), el `<select>` completo desaparece del formulario en vez de mostrarse vacío o con un placeholder falso — un filtro sin opciones reales no aporta nada y confunde.

**Verificado de punta a punta:** con el backend y Postgres corriendo de verdad (no mockeado) y el
seed ampliado, se confirmó que el endpoint devuelve las 4 comunas reales (`El Monte`, `Melipilla`,
`San Pedro`, `Talagante`) y que filtrar por una de ellas (Talagante) devuelve exactamente las 2
propiedades sembradas ahí.

### Fase 14 — Buscador integrado como card flotante

**Decisión — los mismos tres filtros pasan de formulario plano a card destacada bajo el hero.**
Funcionalmente no cambió nada (comuna, operación, tipo, mismo endpoint) — cambió el tratamiento
visual: una card blanca con sombra y borde redondeado, en vez de un formulario suelto sin fondo. Es
el mismo patrón que un buscador integrado de portal real — la búsqueda como elemento central de la
portada, no una sección secundaria. Se probó primero con un `margin-top` negativo para que la card
se superpusiera al borde del hero, pero los indicadores del carrusel (L-18) viven en su propia
franja con espacio propio justo ahí — el resultado quedaba apretado, no "flotante". La versión
final usa un margen positivo normal, sin superposición.

**Decisión — sigue siendo un `<select>` por comuna, no un campo de texto libre.** Con solo un
puñado de comunas reales en el catálogo, un desplegable sigue siendo más simple y sin ambigüedad
que un campo de texto con autocompletado — eso solo se justificaría con muchas más comunas y un
volumen de datos que hiciera necesaria la búsqueda difusa.

**Decisión — el encabezado del catálogo se corrigió a "Melipilla y alrededores".** Con el seed ya
cubriendo Talagante, San Pedro y El Monte además de Melipilla, el título "Propiedades en
Melipilla" a secas quedó desactualizado — un detalle chico, pero un `<h1>` que no refleja lo que
realmente muestra la página por debajo no es un detalle menor para SEO ni para el usuario.

### Fase 15 — Mapa en la ficha de propiedad

**Decisión — Leaflet + OpenStreetMap, ya elegido en la Fase 1 (§2), recién implementado ahora.**
`Property.lat`/`Property.lng` existían en el schema desde el modelo original pero nadie los usaba
todavía. `PropertyMapComponent` los consume: un mapa con un pin en la ficha, sin costo ni tarjeta
de crédito (a diferencia de Google Maps), coherente con un proyecto sin ingresos reales todavía.

**Decisión — el mapa solo se muestra si la propiedad tiene coordenadas reales.** Ninguna
propiedad tiene todavía una dirección exacta geocodificada (`direccion` es un sector genérico, no
una calle real) — mostrar un pin igual, ubicado por ejemplo en el centro de la comuna, se leería
como la ubicación exacta de la propiedad sin serlo. `@if (p.lat !== null && p.lng !== null)`
esconde el bloque completo en vez de fabricar una precisión que no existe.

**Decisión — Leaflet se carga con import dinámico, solo en el navegador.** Igual que el autoplay
del hero (Fase 10), Leaflet manipula el DOM directo contra un elemento real — no tiene sentido
durante SSR y, peor, instanciar un mapa contra un contenedor que no existe todavía en el proceso
de Node rompería el render del servidor. `ngAfterViewInit` con `isPlatformBrowser` más
`await import('leaflet')` deja el bundle del servidor sin ninguna dependencia de Leaflet.

**Bug real: los íconos por defecto de Leaflet se rompen con cualquier bundler moderno.**
`Icon.Default._getIconUrl` antepone incondicionalmente una ruta auto-detectada (vía un truco de
lectura de una clase CSS) delante de la URL que se le configure — así que ni siquiera
`Icon.Default.mergeOptions({ iconUrl: '...' })` alcanza para reemplazarla del todo; el resultado
era una URL con un prefijo `/media//leaflet/...` que nunca existió, y el pin se veía roto. La
salida real fue no tocar `Icon.Default`: se arma un ícono propio con `L.icon({ iconUrl, ... })` y
se le pasa explícito a cada `L.marker(coords, { icon })` — esa ruta de código no tiene el
comportamiento de anteponer nada. Los PNG del ícono se copiaron a `public/leaflet/` en vez de
importarlos como asset del bundler, para no depender de si el pipeline de esbuild resuelve
imports de imágenes de la misma forma que otros bundlers.

**Decisión — `scrollWheelZoom: false`.** Sin esto, hacer scroll normal de la página mientras el
cursor pasa sobre el mapa termina haciendo zoom al mapa en vez de bajar la página — una trampa de
scroll clásica. El usuario igual puede hacer zoom con los botones +/- o gesto de pellizco en móvil.

**Decisión — los tiles de OpenStreetMap no cambian con el tema claro/oscuro del sitio.** Es una
limitación real de usar tiles rasterizados públicos (no hay una versión "oscura" gratuita sin
cuenta ni configuración adicional) — se deja así a propósito en vez de invertir colores con CSS
`filter`, que distorsionaría los tiles y los haría menos legibles.

**Bug real en el seed: `update` del upsert no sincronizaba campos nuevos.** Al agregar
`lat`/`lng` a `DEMO_PROPERTIES`, correr el seed sobre datos que ya existían de una corrida
anterior no los guardaba — el `update` del upsert traía una lista angosta escrita a mano (solo
`estado` y `videoUrl`), el mismo patrón de bug que ya había afectado a `comunaId` en la Fase 13.
Se corrigió para que `update` y `create` compartan el mismo objeto de datos derivado de
`DEMO_PROPERTIES`, así un campo nuevo se sincroniza automáticamente sin volver a tocar esta lógica.

**Verificado con interacción real vía Playwright:** carga del mapa contra los tiles reales de
OpenStreetMap (no un mock), confirmando 0 errores de consola, el marcador presente en el DOM, y
los tiles efectivamente cargados — no solo que el contenedor se veía bien vacío. Se detectó y
corrigió el bug del ícono roto en este mismo proceso, comparando la URL real solicitada contra la
esperada.

### Fase 16 — Foto y video lado a lado en desktop; video de relleno propio

**Decisión — grid de dos columnas solo cuando existen ambos medios, y solo desde 640px.** Con
`display: grid; grid-template-columns: 1fr` como base (una columna, mobile-first) y un modificador
`.ficha__media--dual` que activa `grid-template-columns: 1fr 1fr` en pantallas más anchas, el
layout de dos columnas aparece únicamente cuando la propiedad tiene foto Y video — con solo uno de
los dos, ese elemento sigue ocupando una sola columna angosta (`max-width: 500px`) en vez de
estirarse a lo ancho o dejar la mitad de la fila vacía junto a él.

**Decisión — video de relleno propio (5s, generado con `ffmpeg`), no un video público
descargado.** El video de muestra anterior era un cortometraje libre de Blender Foundation — servía
para probar que el `<video>` funcionaba, pero no tenía ninguna relación con el rubro ni con la
identidad visual del sitio. El nuevo video es un clip de 5 segundos con el color de acento de la
marca y el texto "Video de prueba — de relleno" (mismo criterio que las fotos SVG: honesto sobre
ser contenido de relleno, no una visita real), generado con un filtro `drawtext` de `ffmpeg` y
servido como archivo estático desde `public/demo-video/`, igual que las fotos.

**Verificado visualmente vía Playwright:** capturas en desktop (foto y video lado a lado),
mobile (apilados) y en una ficha con solo foto (columna única, sin espacio vacío), confirmando los
tres casos del layout condicional.

### Fase 17 — SEO: meta tags, JSON-LD, robots.txt y sitemap dinámico

**Decisión — `SeoService` centraliza title, meta description, Open Graph, Twitter Card y
canonical.** Usa `Title`/`Meta` de Angular (corren también durante SSR, así que el HTML que recibe
un crawler o el bot de previsualización de WhatsApp ya trae estos tags — no dependen de que se
ejecute JavaScript en el navegador). El canonical y el JSON-LD no tienen soporte nativo en `Meta`,
así que se manejan a mano contra el `DOCUMENT` inyectado.

**Decisión — la ficha de propiedad arma su meta description y su Open Graph a partir de datos
reales de esa propiedad, no un texto genérico repetido en todas las fichas.** Título, precio,
comuna y las primeras líneas de la descripción real arman una meta description dinámica; la
primera foto (si existe) se usa como `og:image`/`twitter:image` en tamaño 1200x630 — ninguna
imagen de relleno inventada para esto, si la propiedad no tiene fotos simplemente no hay imagen.

**Decisión — JSON-LD `RealEstateListing` con dirección y coordenadas reales cuando existen.**
`comuna`/`región` van en `address` siempre (son datos reales); `geo` (`GeoCoordinates`) solo se
agrega si la propiedad tiene `lat`/`lng` — mismo criterio que el mapa (Fase 15): no inventar
precisión que no existe.

**Decisión — `sitemap.xml` se genera en cada request, no en build time.** El catálogo es
`RenderMode.Server` precisamente porque cambia sin un nuevo deploy (Fase 8/9) — un sitemap
generado una vez en el build quedaría desactualizado apenas se publicara una propiedad nueva. La
ruta se agrega directo en `server.ts` (antes del handler catch-all de Angular), pide todas las
páginas de `GET /properties` al backend y arma el XML con las URLs reales — si el backend no
responde, el sitemap sale igual con las rutas estáticas (`/`, `/publicar`) en vez de devolver un
500 al crawler.

**Decisión — `robots.txt` sí es estático.** A diferencia del sitemap, su contenido no depende de
qué propiedades existen — vive como archivo plano en `public/`, sin necesidad de generarlo por
request.

**Bug real: el servidor SSR devolvía 400 en local sin `NG_ALLOWED_HOSTS`.** Ya documentado en la
Fase 8 (validación de `Host` contra una lista blanca, mitigación de CVE-2026-27739) — volvió a
aparecer acá al levantar el build de producción a mano en un puerto distinto al de `ng serve`
durante la verificación. Confirma por qué esa variable de entorno es indispensable en cualquier
entorno que no sea el dev server de Angular.

**Verificado con un build real, no solo con el dev server:** `ng build --configuration
development` completo, servido con `node dist/frontend/server/server.mjs` contra el backend real,
confirmando con `curl` que el HTML devuelto por el servidor (antes de cualquier JavaScript del
navegador) ya trae title, meta description, Open Graph, canonical y JSON-LD — en el catálogo y en
una ficha real. `sitemap.xml` se verificó con las 10 propiedades reales del seed, no con datos de
prueba inventados para la ocasión.

### Fase 18 — Skip-link de accesibilidad

**Decisión — un solo skip-link global en `app.ts`, no uno por página.** `<a href="#main-content"
class="skip-link">` es el primer elemento del documento (antes del header), oculto hasta que
recibe foco de teclado — permite saltar la navegación repetitiva del header directo al contenido
principal. Cada página (`CatalogComponent`, `PropertyDetailComponent`, `PublicarComponent`)
declara su propio `<main id="main-content" tabindex="-1">`, así el mismo link funciona sin
importar en qué ruta esté el usuario. `tabindex="-1"` permite que el `<main>` reciba foco por
programa al saltar — sin eso, algunos lectores de pantalla no anuncian correctamente que el foco
se movió, aunque la página haga scroll visualmente hasta ahí.

**Verificado con interacción real de teclado vía Playwright:** el primer `Tab` del documento
enfoca el skip-link (confirmado leyendo `document.activeElement`, no solo mirando la captura), y
activarlo con `Enter` mueve el foco real a `#main-content` — no solo un scroll visual sin foco.

### Fase 19 — Lighthouse en CI

**Decisión — un job nuevo (`lighthouse`) que levanta el stack completo de verdad, no un
directorio estático.** El catálogo, la ficha y `/publicar` son SSR real (Fase 8/9) — auditar un
build estático no tendría sentido acá. El job levanta un Postgres real como `services:`, corre
las migraciones y ambos seeds, prende el backend, compila el frontend y prende el servidor SSR
compilado, recién ahí corre Lighthouse contra las tres URLs reales.

**Bug real: auditar con el build de `development` infla artificialmente el tamaño del JS.** La
primera corrida de prueba usó `build:dev` (mismo comando usado en el resto del proyecto para
probar features) — resultado: 0.36-0.51 de performance, con "Minify JavaScript" como hallazgo
grande. `development` tiene `optimization: false` a propósito (Fase 2, para depurar más fácil) —
correcto para desarrollar, pero audita un bundle que ningún usuario real va a recibir. Se agregó
una configuración `ci` nueva en `angular.json` (composable: `ng build --configuration
production,ci`) que aplica las optimizaciones de producción pero reemplaza `environment.ts` por
uno que apunta al backend local del job, no al de producción real — el CI nunca debe pegarle a
producción durante una auditoría.

**Bug real: el servidor Express no comprimía las respuestas.** Con el build ya optimizado, el
hallazgo más grande de Lighthouse pasó a ser "Enable text compression" (~7s). Se agregó
`compression()` como middleware en `server.ts`, antes de cualquier otra ruta — gzip/brotli vía
`Accept-Encoding` es soporte universal en cualquier navegador real, no había ninguna razón para
no comprimir por defecto.

**Decisión — `performance` en nivel `warn`, el resto (`accessibility`, `best-practices`, `seo`)
en `error`.** El puntaje de performance varía más entre corridas (throttling de CPU emulado,
carga variable del runner compartido de CI) — bloquear el pipeline por una fluctuación de
performance sería más ruido que señal. Los otros tres puntajes son bastante más estables corrida
a corrida, así que sí vale la pena que bloqueen un merge si bajan del umbral.

**Verificado con las tres páginas auditadas de verdad, no solo con la config aplicada:**
performance 0.85–0.93, accesibilidad 0.92–0.95, buenas prácticas 0.96–1.0, SEO 1.0 en las tres
— catálogo, `/publicar` y una ficha real, contra el backend y Postgres corriendo de verdad.

### Fase 20 — Panel de administración

**Decisión — el panel deja de ser opcional: sin él, cargar una propiedad real significa entrar a
mano con Postman contra el backend.** El MVP curado (§1) asume que un admin carga las propiedades
— pero nunca se había construido la herramienta para hacerlo. No es una feature más del roadmap:
es requisito para poder operar el negocio con contenido real, independiente de que el documento de
alcance original no la detallara explícitamente.

**Decisión — `/admin/**` es `RenderMode.Client`, la decisión de la Fase 9 recién implementada.**
Un panel detrás de login no lo indexa nadie y nadie lo visita con mala señal esperando un preview
rápido — renderizarlo en servidor solo agregaría latencia sin ningún beneficio real. `header` y
`footer` del sitio público (con el link de "publicar tu propiedad", el toggle de tema del portal)
tampoco se muestran ahí — `App` calcula `esAdmin` a partir de `Router.events` y los oculta con
`@if`, porque son parte de la identidad del catálogo público, no de una herramienta interna.

**Decisión — JWT en `localStorage`, revalidado en cada 401, no un guard que valide el token
contra el backend en cada navegación.** `authGuard` solo comprueba que exista un token guardado
(barato, sin round-trip) — si el token venció o la cuenta fue borrada, el `JwtStrategy` del
backend (Fase 12) lo rechaza en la primera request real, y un interceptor HTTP captura ese 401 y
cierra la sesión ahí mismo. Confiar en el borde real (la respuesta del backend) es más simple y
igual de correcto que duplicar la validación del lado del cliente.

**Decisión — nuevo endpoint `GET /comunas` (protegido, las 346 comunas), distinto de
`GET /properties/comunas` (público, solo las que ya tienen propiedades).** El selector del
formulario de admin necesita poder elegir *cualquier* comuna del país, incluida la primera
propiedad en una zona nueva — el endpoint público existente filtra exactamente lo contrario a
propósito (Fase 13). Se armó como un módulo (`LocationsModule`) separado de `PropertiesModule`
porque `Comuna` no es un concepto de propiedades, es un catálogo de ubicación aparte.

**Decisión — crear primero, subir fotos/video después — nunca antes de que la propiedad
exista.** El formulario de "nueva propiedad" no muestra la sección de fotos/video: al guardar,
redirige a la misma pantalla en modo edición (ahora con id real). Permitir subir fotos antes de
guardar dejaría archivos huérfanos en Cloudinary si el usuario nunca completa el guardado — más
simple no generar ese estado que limpiarlo después.

**Decisión — subida de fotos en cola secuencial, no en paralelo.** Cada foto pide su propia firma
al backend (Fase 14 — timestamps de firma vencen en minutos) y se sube una por una: la siguiente
solo arranca cuando la anterior terminó de subirse a Cloudinary y quedó registrada con
`POST /properties/:id/fotos`. Más lento que en paralelo para varias fotos, pero evita condiciones
de carrera en el campo `orden` (cada foto necesita saber cuántas van antes que ella).

**Verificado de punta a punta con Playwright contra el backend real:** entrar a una ruta
`/admin/*` sin sesión redirige a `/admin/login`; login real con la cuenta admin sembrada; el
listado carga las 10 propiedades reales; el selector de comuna trae las 346 reales y el de
publicador la corredora demo real; crear una propiedad de prueba la agrega de verdad al listado
(11 filas) y redirige a edición; el header/footer público no aparece en ninguna pantalla de admin.

**Cloudinary con cuenta real, verificado con una subida real.** Con las credenciales reales ya
configuradas (`CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET` del plan free), se subió una foto de
prueba desde el panel y quedó de verdad en la cuenta de Cloudinary — `secure_url` real devuelta,
`PropertyFoto` registrada contra la propiedad, y la imagen visible en la ficha con la transformación
`c_fill,w_,h_,q_auto,f_auto` (Fase 6). La foto y el archivo de prueba se borraron después (tanto de
Cloudinary como de la base) para no dejar contenido de prueba en la cuenta real ni en el seed de
demo.

**Bug real: el mensaje de error del formulario era siempre el mismo, sin importar qué había
fallado de verdad.** Cualquier error (un campo vacío, un id inválido, la red caída) mostraba la
misma frase genérica — así que un campo obligatorio sin marcar visualmente y un error genérico se
combinaban para hacer imposible saber qué corregir. Se agregaron dos cosas: asteriscos visibles en
los campos obligatorios del formulario, y un manejo de error que lee `error.error.message` (el
array de mensajes que devuelve `class-validator` en un 400) y lo muestra tal cual, en vez de una
frase fija — "no se pudo guardar" pasó a ser "publicadorId should not be empty · descripcion must
be longer than or equal to 20 characters", nombrando el campo real.

**Bug real: `publicadorId`/`comunaId` vacíos pasaban la validación y llegaban a Prisma.** Un
`<select>` de Angular sin tocar manda `''` (string vacío, no `undefined`) — `@IsString()` sin
`@IsNotEmpty()` no rechaza eso, así que el string vacío llegaba hasta la base y fallaba como
violación de foreign key (un 500 críptico) en vez de un 400 claro y legible. Se agregó
`@IsNotEmpty()` a ambos campos en `CreatePropertyDto`.

**Bug real: el formulario de admin tenía scroll horizontal en mobile.** Causa clásica de
flexbox: los hijos de un contenedor `flex-direction: column` (`.form__field`) no se achican más
allá de su ancho de contenido por defecto (`min-width: auto` implícito) — un `<select>` con una
opción larga empujaba todo el formulario fuera del viewport. Se corrigió con `min-width: 0` en
`.form__field` y en `fieldset` (que además trae su propio `min-width: min-content` del navegador),
más `width: 100%` explícito en los `input`/`select`/`textarea`. La tabla del listado, que ya
scrolleaba correctamente dentro de su propio contenedor (`overflow-x: auto`, sin arrastrar la
página completa), sumó un aviso de texto en mobile para que no se sienta como que "se corta" sin
razón.

**Verificado con Playwright en viewport mobile real (390px):** sin overflow horizontal en el
formulario después del fix (antes sí lo había, confirmado con
`document.documentElement.scrollWidth`); el mensaje de error de un guardado vacío nombra los 5
campos reales que faltan, no una frase genérica.

### Fase 21 — Capa de movimiento: scroll-reveal, crossfade y skeleton loading

**Decisión — la "vida" que le faltaba al sitio es sobre todo un problema de fotos reales, no de
animación.** Investigación real contra portales en producción (Compass, TocToc, Rightmove) antes
de construir nada: Compass mantiene su interfaz deliberadamente en blanco y negro porque la
fotografía de la propiedad aporta todo el color — ningún portal grande depende de animaciones de
chrome para sentirse vivo, dependen de fotos reales grandes. El sitio sigue con SVG de relleno
(Fase 17), así que ninguna animación agregada acá resuelve eso de fondo — se documenta para no
repetir la pregunta más adelante. Lo que sí se puede cerrar sin depender de fotos reales es la
brecha real de movimiento: scroll-reveal, transiciones de foto, y estados de carga con esqueleto,
todos ausentes hasta ahora.

**Decisión — `RevealOnScrollDirective` propia, sin librería.** Un `IntersectionObserver` nativo +
una clase CSS (`.reveal` / `.reveal--visible`) — mismo criterio que ya se usó para no meter Swiper
en los sliders. Se aplica con un delay creciente (`--reveal-delay`) para escalonar tarjetas del
catálogo y pasos de `/publicar`, en vez de que todos aparezcan de golpe. SSR-safe
(`isPlatformBrowser`, igual que el autoplay del hero) y `disconnect()` apenas se revela una vez —
no vuelve a observar de ida y vuelta si el usuario hace scroll arriba y abajo.

**Decisión — crossfade real (opacidad superpuesta) en el hero y el slider de fotos, no un corte
seco reemplazando el `src`/contenido.** Ambos componentes pasaron de "renderizar solo el slide
activo" a "renderizar todos los slides superpuestos (`position: absolute`) y alternar opacidad" —
el slide/foto inactivo queda con `pointer-events: none`, `aria-hidden="true"` y `tabindex="-1"` en
sus links, para que no reciba clicks ni foco de teclado mientras es invisible.

**Decisión — estados de carga con skeleton, no texto plano "Cargando…".** Nuevo
`PropertyCardSkeletonComponent`, mismas proporciones que la tarjeta real (foto 3:2 + líneas de
texto) con un pulso sutil. El `<p role="status">` sigue existiendo para un lector de pantalla,
pero visualmente oculto (`.sr-only`) — el esqueleto es la señal visual, el texto es la señal para
accesibilidad, cada uno resuelve la mitad del problema.

**Decisión — todo el movimiento nuevo respeta `prefers-reduced-motion`.** Cada transición/animación
nueva (reveal, crossfade, hover, skeleton) vive dentro de `@media (prefers-reduced-motion:
no-preference)` — quien pidió menos movimiento al sistema operativo ve el contenido de inmediato,
sin esperar una transición que no va a correr, y sin perder ninguna sombra o color que no dependa
de desplazamiento.

**Verificado con datos reales, no solo visualmente:** se leyó `getComputedStyle(...).opacity` de
verdad durante las transiciones — las tarjetas fuera de pantalla arrancan en `0` y llegan a `1`
tras el scroll; a mitad de una transición de hero se confirmaron dos slides con opacidades
intermedias simultáneas (una subiendo, otra bajando — crossfade real, no una sustitución
instantánea); con `reducedMotion: 'reduce'` emulado en el navegador, la opacidad inicial de una
card es `1` de entrada, confirmando que el guard funciona.

### Fase 22 — Deploy real a producción (Neon + Render + Netlify)

**Decisión — el backend en Render usa la connection string *pooled* de Neon en runtime, pero la
*directa* (sin pooler) para correr las migraciones.** Neon recomienda la conexión directa para
`prisma migrate deploy` porque el pooler (PgBouncer en modo transacción) puede interferir con los
prepared statements que usa Prisma durante una migración — para tráfico normal de la app, en
cambio, la pooled es la correcta.

**Bug real: `NODE_ENV=production` como variable de entorno en Render rompe el build de NestJS.**
`npm ci` respeta `NODE_ENV=production` salteándose las devDependencies — ahí vive `@nestjs/cli`,
que provee el comando `nest` que usa `npm run build`. El build fallaba con `sh: 1: nest: not
found`. Se corrigió el Build Command a `npm ci --include=dev && npx prisma generate && npm run
build` — fuerza la instalación de devDependencies sin importar `NODE_ENV`, sin afectar el runtime
(que ya corre JavaScript compilado en `dist/`, no necesita esas herramientas).

**Decisión — `siteUrl` apunta al subdominio de Netlify (`market-propiedades.netlify.app`),
todavía no al dominio real.** El dominio `marketpropiedades.cl` no está comprado/conectado aún —
dejar `siteUrl` (usado en canonical, JSON-LD y el `Sitemap:` de `robots.txt`) apuntando a un
dominio que no sirve nada rompería exactamente lo que se construyó en la Fase 17. Cambiar ese
valor y volver a desplegar el día que exista el dominio real.

**Decisión — el panel de administración necesitaba un punto de entrada real, no solo una URL de
memoria.** `/admin/login` no tenía ningún link que llevara ahí desde el sitio público. Se agregó
un link discreto junto al copyright del footer (`Acceso administrador`) — mismo tamaño/color que
el texto de copyright, a propósito: es la puerta de entrada del admin, no un link de navegación
para cualquier visitante.

**Verificado contra la infraestructura real, no solo localmente:** `prisma migrate deploy` aplicó
las 3 migraciones contra Neon; el seed real (346 comunas, 16 regiones, la cuenta admin) se
confirmó contando filas reales (`Comunas: 346`, `Regiones: 16`, `Usuarios: 1`, `Propiedades: 0` —
nunca se corrió el seed de demo contra producción). El backend en Render se probó con `curl` real:
`/` responde 200, `/properties` devuelve el catálogo real vacío, `/comunas` devuelve 401 sin
token, y `/auth/login` con las credenciales reales devuelve un JWT válido.

**Bug real: el frontend en Netlify quedó desplegado como sitio estático puro, sin SSR — la home
daba 404.** El log del deploy mostró `0 new function(s) to upload`: Netlify nunca generó la
función que ejecuta el servidor SSR. Causa real, confirmada contra el código fuente del paquete
`@netlify/angular-runtime` (no contra documentación de terceros, que dio información contradictoria
e incluso un nombre de paquete inventado en el camino — se verificó cada afirmación contra `npm
view` antes de actuar): el plugin de Netlify solo reemplaza automáticamente `server.ts` por su
propia versión compatible si detecta que es *exactamente* el archivo por defecto del scaffold de
Angular. Nuestro `server.ts` traía dos cambios propios (compresión gzip, la ruta de
`GET /sitemap.xml`) — al no coincidir con el default, Netlify no generó ninguna función SSR y sirvió
solo los archivos estáticos de `browser/` (por eso `robots.txt`/`favicon.ico` sí respondían 200,
pero `/` no).

**Decisión — `server.ts` vuelve a ser exactamente el default del scaffold; `sitemap.xml` se muda a
una Netlify Function aparte.** En vez de pelear con la detección de Netlify, se saca toda
personalización de `server.ts` — así el plugin lo reemplaza sin problema por su propia función SSR
compatible (requiere `@netlify/angular-runtime` instalado como devDependency, para que el
compilador de Angular pueda resolver los imports que el plugin inyecta). La lógica de
`sitemap.xml` se movió tal cual a `netlify/functions/sitemap.mts`, una Netlify Function
independiente con `export const config = { path: '/sitemap.xml' }` — se registra sola en esa ruta,
sin necesitar un redirect en `netlify.toml`.

**Decisión — la compresión gzip que se había agregado en la Fase 19 no se repone en ningún
lado.** No hace falta: el edge de Netlify comprime las respuestas automáticamente según el
`Accept-Encoding` del navegador, sin importar si el origen (la función SSR) la comprime o no. Sigue
siendo relevante para cualquier despliegue Node genérico sin CDN por delante (por eso se documenta
acá en vez de borrarse sin dejar rastro) — el job de Lighthouse en CI, que audita nuestro propio
`server.mjs` compilado y no el resultado real en Netlify, puede volver a marcar "Enable text
compression" como hallazgo; queda en nivel `warn`, no bloquea el pipeline, y no representa el
comportamiento real en producción.

**Verificado sin confiar en documentación de terceros a ciegas:** cada afirmación se contrastó
contra el registro real de npm (`npm view <paquete> version`) antes de instalar nada — un nombre de
paquete sugerido por una búsqueda (`@netlify/plugin-angular`) no existía. La función del sitemap se
probó importándola y ejecutándola directo con `tsx` contra el backend real de producción, no solo
revisando que compilara: devolvió `200`, `content-type: application/xml`, y el XML real con las
rutas estáticas (sin propiedades todavía, coherente con el estado real de la base).
