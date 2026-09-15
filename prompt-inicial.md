# Market Propiedades — prompt inicial

> Pega esto como primer mensaje al abrir una ventana de contexto nueva, en la carpeta del
> proyecto nuevo (no en la de Imperio Barber). Reemplaza los `[...]` con lo que corresponda
> cuando lo tengas.

---

Quiero construir **Market Propiedades** (dominio ya reservado: `www.marketpropiedades.cl`) — un
portal inmobiliario para Melipilla, una plataforma de propiedades para venta y arriendo. Nace de
una idea de mi socio Julián: él se encarga de la parte comercial (captar clientes y propiedades) y
del marketing digital/marca/contenido (incluye Meta Ads); yo del desarrollo completo. Va con el
mismo estándar que Imperio Barber, mi proyecto anterior — quiero que sea mi mejor trabajo hasta
ahora.

**Estado de la sociedad con Julián:** todavía sin cerrar el %, pero encaminado — quedamos en
juntarnos a hablarlo en persona (no por texto). Él se ve genuinamente entusiasmado con el proyecto;
de hecho comentó que si esto anda bien, le gustaría capacitarse en corretaje él mismo — vale la
pena tenerlo en cuenta como parte de su motivación a largo plazo, no solo como socio de marketing.

Antes de tocar código quiero la conversación de alcance completa: stack, modelo de datos, qué
entra al MVP y qué queda fuera a propósito. Todo documentado en `ARCHITECTURE.md` desde el primer
commit, como diario de decisiones técnicas puro (nunca estado de proyecto ni próximos pasos).

## La idea de negocio (tal como la planteó mi socio — sin validar todavía, no darla por buena sin más)

- **Plataforma tipo galería**: se publican propiedades (casas, parcelas, terrenos, locales
  comerciales) para **venta y arriendo**.
- **Quién publica:** personas naturales **y** corredoras de propiedades (empresas) — dos tipos de
  publicador distintos, probablemente con necesidades distintas.
- **Cada publicación:** fotos + video + descripción + contacto (dueño o corredora a cargo).
- **Contacto directo por WhatsApp** desde la publicación (API de WhatsApp, o algo más simple tipo
  link `wa.me` — a definir).
- **Botón "Agendar visita a la propiedad".**
- **Monetización — paquetes pagados** que incluyen: posición dentro de la plataforma (destacados
  cuestan más), creación de galería de imágenes, creación de video, creación y gestión de campaña
  de Meta Ads + difusión en redes.
- **Comisión por venta** (% sin definir). Referencia: una corredora con la que mi socio ya trabajó
  cobra 4% del total de venta, y le ofreció a él personalmente 2% por las propiedades que él
  difunda con marketing digital.
- **Beta propuesta:** usar esas propiedades de esa corredora como contenido semilla para arrancar
  con movimiento real en la plataforma.

## Estándar de la industria en Chile (investigado contra portales reales, no de memoria)

- **El líder del mercado (PortalInmobiliario/MercadoLibre) prohíbe contacto directo en la ficha**
  (WhatsApp/teléfono/email) — obliga a usar su sistema de mensajería interno para no perder el
  lead. El contacto directo por WhatsApp que propone mi socio **no es solo una feature, es una
  diferenciación real frente al líder**, no algo cosmético.
- **Ficha de propiedad estándar:** tipo de operación (venta/arriendo), tipo de propiedad (casa,
  depto, parcela, terreno, oficina, local, bodega), ubicación (región + comuna), **precio en UF
  para venta / CLP para arriendo** (hay que soportar ambas monedas, es la convención chilena),
  m² construidos + m² de terreno, dormitorios, baños, estacionamientos, bodega, gastos comunes,
  galería de fotos + video, descripción libre.
- **Búsqueda:** filtros por comuna/tipo/precio/dormitorios + mapa con pines — esperado en todos
  los portales serios (Goplaceit lo destaca explícitamente).
- **Monetización por niveles ya es estándar de industria**, no una idea rara del socio: TOCTOC deja
  3 publicaciones gratis y cobra desde la 4ª; otros portales combinan gratis para particulares +
  planes pagados para profesionales/corredoras. Confirma que el modelo de paquetes que propuso mi
  socio calza con cómo funciona el mercado real.
- **Lo que la competencia grande tiene y probablemente NO entra al MVP** (fase 2+): simulador de
  crédito hipotecario / tasación automática, tours virtuales 360°/VR, alertas de búsqueda guardada
  y recomendaciones con IA, comparador de propiedades — todos requieren datos o volumen que no
  vamos a tener al lanzar.

## IA en el producto — parte del MVP, no fase 2

No necesito más capacidad de cómputo para esto — se hace con una llamada a una API (Anthropic,
OpenAI, Google), sin alojar ni entrenar nada propio. Costo real: bajísimo para estos dos casos de
uso (fichas de cientos de palabras, no dataset grande ni miles de llamadas por segundo).

1. **Generación de descripciones de propiedad** (prioridad — conecta directo con el negocio): el
   publicador sube fotos + datos básicos (tipo, m², dormitorios, ubicación) y un LLM redacta un
   borrador de descripción. Es, automatizado, el mismo servicio de "generación de contenido" que
   mi socio ya quiere vender dentro de los paquetes pagados.
2. **Búsqueda en lenguaje natural**: el usuario escribe algo tipo "depto 2 dormitorios cerca del
   metro bajo 100 millones" en un campo libre, y un LLM lo traduce a los mismos filtros
   estructurados que de todos modos vamos a construir (comuna, tipo, precio, dormitorios).

Dejar para después (necesitan datos/volumen que no vamos a tener al lanzar): tasación automática
de precio, recomendaciones personalizadas, chatbot con RAG.

## Sin resolver todavía — no asumir nada de esto, confirmarlo conmigo antes de construir sobre ello

- **Reparto entre socios:** todavía no hay nada definido (%, sociedad, o si me paga por el
  desarrollo). Le mandé un mensaje a mi socio preguntando esto directamente — puede que ya tenga
  respuesta cuando retome este proyecto, puede que no.
- **La comisión del 2%:** es un trato personal que le ofrecieron a mi socio antes de que existiera
  la plataforma — sin definir si entra a repartirse entre los dos o queda aparte.
- **Campos exactos de cada entidad:** qué datos tiene una propiedad (tipo, ubicación, precio, m²,
  estado), qué datos necesita un publicador (persona natural vs. corredora — probablemente
  distintos), y qué define exactamente cada paquete pagado (qué incluye, cómo se cobra, quién lo
  gestiona). Mi socio todavía no me dio esto en detalle — hay que pedírselo o definirlo junto con
  él antes de cerrar el modelo de datos.

## Complejidad real de este proyecto que Imperio Barber no tenía

- **Multi-publicador desde el día uno:** personas naturales y empresas (corredoras) publicando en
  la misma plataforma — probablemente necesitan cuentas/perfiles diferenciados, no un panel de
  administración único como en Imperio Barber (que era una sola barbería).
- **Pagos reales integrados:** los paquetes se cobran de verdad — hace falta una pasarela de pago
  (Mercado Pago u otra) desde el MVP. En Imperio Barber se decidió explícitamente no construir
  pagos; acá es el corazón del modelo de negocio, no se puede evitar.
- **Posible necesidad de un componente de "ranking pagado"** (destacados cuestan más) — hay que
  pensar cómo se ordena/pondera la grilla de propiedades sin que se sienta injusto para quien no
  paga.

## Stack y consideraciones técnicas — propuesta de partida (a confirmar en la conversación de alcance, no asumir cerrado)

**Lo que se reutiliza directo de Imperio Barber** (patrones ya probados, no copiar código literal
— cada uno se vuelve a evaluar contra lo que este proyecto realmente necesita):
- Backend NestJS + TypeScript + PostgreSQL, Prisma con driver adapter (`@prisma/adapter-pg`) —
  ya conozco los problemas típicos de Prisma 7 (config movida a `prisma.config.ts`, ESM por
  defecto en el cliente generado) y cómo se resuelven.
- JWT + argon2 para el panel de administración (mismo patrón: `JwtStrategy` revalida contra la
  base en cada request).
- Contacto directo por WhatsApp con link pre-armado (`wa.me`) — ya resuelto una vez, incluida la
  lógica de fecha/hora en español.
- Cloudinary con firma generada en el backend para fotos/videos de propiedades — mismo patrón que
  las fotos de barberos, el archivo nunca pasa por el servidor.
- `.nvmrc` por proyecto, Postgres local en Docker, GitHub Actions desde el primer commit (con
  `prisma generate` en TODOS los jobs que lo necesiten — me faltó en uno en Imperio Barber y el
  CI falló solo ahí, ya sé cuidarme de eso ahora).
- Formato de `ARCHITECTURE.md` como diario de decisiones (ya en mi `CLAUDE.md` global, no hace
  falta repetirlo acá).

**Lo que es genuinamente nuevo para este proyecto — no asumir que se resuelve igual que en Imperio Barber:**
- **Frontend con SSR/prerender, no solo standalone client-side.** Cada propiedad necesita ser
  indexable por Google (SEO) — a diferencia de Imperio Barber (una sola landing de una barbería),
  acá van a existir muchas fichas de propiedad, cada una es una oportunidad de tráfico orgánico
  real, no solo de Meta Ads pagado. Evaluar Angular con SSR (o SSG si el catálogo se puede
  regenerar periódicamente) — decisión pendiente de la conversación de alcance.
- **Pasarela de pago real desde el MVP** (Mercado Pago, dominante en Chile) para cobrar los
  paquetes — Imperio Barber decidió explícitamente no construir esto; acá es el corazón del
  negocio, no se puede evitar ni simplificar.
- **Mapa con pines** — decisión pendiente entre Google Maps (más pulido, tiene costo a escala,
  geocodificación incluida) y Leaflet + OpenStreetMap (gratis, necesita un servicio de
  geocodificación aparte). No decidir sin pesar el costo esperado a futuro.
- **Multi-publicador (personas + corredoras)** — para el MVP curado (ver más abajo) esto se
  simplifica a "solo nosotros publicamos desde el panel", pero el modelo de datos de `User`
  debería dejar espacio para roles futuros (persona / agente / admin) sin tener que rehacerlo.
- **IA vía API** (Anthropic/OpenAI/Google) para generación de descripciones y búsqueda en
  lenguaje natural — sin infraestructura propia, ver sección de IA más arriba.

## Cómo quiero trabajar

Conversación de alcance primero, no código. Ya tengo en mi `CLAUDE.md` global el estándar de
"ingeniero senior + proceso" — aplícalo acá sin que tenga que repetirlo.
