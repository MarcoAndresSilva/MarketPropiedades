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
