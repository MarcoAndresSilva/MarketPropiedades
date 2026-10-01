---
name: auditoria
description: Auditoría de calidad del código de Habbi (backend NestJS + frontend Angular). Revisa duplicación, patrones mal aplicados, nombres poco claros, componentes demasiado grandes, incumplimiento de las convenciones del proyecto y contradicciones con ARCHITECTURE.md, y entrega un informe priorizado con refactors propuestos como commits atómicos. Úsala cuando el usuario pida una auditoría, una revisión de calidad o "/auditoria", idealmente al cerrar cada etapa. Acepta un alcance opcional ("backend", "frontend", una carpeta o un archivo).
---

# Auditoría de código — Habbi

Auditoría periódica para que el proyecto no acumule deuda técnica mientras crece. El
objetivo es **encontrar y priorizar**, no reescribir: se entrega un informe y el equipo decide
qué se refactoriza.

## Reglas

1. **No se modifica ningún archivo durante la auditoría.** Solo se lee, se corren los chequeos
   automáticos y se entrega el informe. Los refactors se hacen después, uno por uno, con
   aprobación explícita de Marco, cada uno en su propio commit y nunca mezclado con una
   funcionalidad nueva.
2. **Nunca commitear.** Marco revisa y commitea. Se sugieren commits atómicos con mensaje
   explicativo y la lista exacta de archivos (cada archivo en un solo commit).
3. **ARCHITECTURE.md manda.** Antes de marcar algo como problema, revisar si es una decisión
   documentada. Si lo es, no es un hallazgo; como mucho, un comentario de que la decisión
   quedó desactualizada.
4. **Sin sobreingeniería.** No proponer abstracciones "por si acaso". Algo se extrae a un lugar
   común solo si ya se repite (tres veces, o dos veces con lógica no trivial) o si su
   duplicación ya causó un bug.
5. **Hallazgos concretos.** Cada hallazgo lleva archivo y línea (`ruta:línea`), qué pasa, por
   qué importa y qué se propone. Sin generalidades del tipo "mejorar la legibilidad".
6. **Honestidad sobre el alcance.** Si algo no se pudo revisar (tiempo, tamaño), decirlo.

## Alcance

- Sin argumento: todo el proyecto (`backend/src`, `backend/prisma`, `frontend/src`).
- Con argumento: solo esa parte (`backend`, `frontend`, una carpeta o un archivo).
- Nunca auditar código generado ni dependencias: `backend/src/generated/`, `node_modules/`,
  `dist/`, `.angular/`.

## Paso 1 — Contexto

Leer `ARCHITECTURE.md` completo (las decisiones y convenciones del proyecto) y `git log
--oneline -30` para saber qué cambió desde la última auditoría. Si hay un informe anterior en
la conversación o en memoria, revisar qué quedó pendiente de ese.

## Paso 2 — Chequeos automáticos

Correr y anotar el resultado exacto (usar Node 22: `source ~/.nvm/nvm.sh && nvm use 22`):

| Chequeo | Comando |
|---|---|
| Lint backend | `cd backend && npm run lint` |
| Tipos backend | `cd backend && npx tsc -p tsconfig.build.json --noEmit` |
| Tests backend | `cd backend && npm test` |
| Lint frontend | `cd frontend && npm run lint` |
| Build frontend (producción) | compilar en una copia (worktree en el scratchpad), nunca en `frontend/dist` ni en `backend/dist` si Marco tiene sus servidores corriendo |

Un chequeo que falla es un hallazgo de prioridad alta por sí mismo.

## Paso 3 — Revisión manual

Revisar con criterio lo que un linter no ve:

**Duplicación**
- Lógica repetida entre archivos: servicios, formularios del admin, manejo de errores HTTP,
  formateo de precios y fechas, llamadas a la API.
- Estilos SCSS copiados entre componentes en vez de reutilizar las clases de `_base.scss`.
- Componentes casi iguales que podrían ser uno con un `input()`.

**Diseño y patrones**
- Componentes o servicios demasiado grandes (más de ~250 líneas de lógica, o varias
  responsabilidades distintas).
- Lógica de negocio en componentes que debería vivir en un servicio, o en controllers de
  NestJS que debería vivir en el service.
- Validación duplicada entre frontend y backend sin que el backend sea la fuente de verdad.
- Acceso a `localStorage`, `window` o `document` sin protección para SSR.
- Suscripciones sin `takeUntilDestroyed` o sin completarse.
- Consultas Prisma en loops (N+1), `include` que trae más de lo que se usa, falta de índices para
  filtros frecuentes.
- Endpoints sin guard que deberían tenerlo, DTOs sin validación, datos del usuario sin
  sanitizar.

**Convenciones del proyecto**
- Cada componente en tres archivos: `.ts`, `.html`, `.scss` (sin `template:` ni `styles:`
  inline).
- Nombres claros y consistentes. Convención vigente: métodos de servicios y controllers de
  NestJS en inglés con el estilo del framework (`findPublished`, `create`); el dominio del
  negocio en español (`precioRefUf`, `titulo`, `comuna`, `tipoOperacion`). Marcar nombres
  ambiguos (`data`, `item`, `tmp`, `x`), abreviaturas poco claras y mezclas que rompan esa
  regla.
- Comentarios que explican el **por qué**, no el qué. Marcar comentarios desactualizados o que
  contradicen el código.
- Colores y medidas desde los tokens de `_theme.scss`, no valores sueltos (salvo casos
  documentados, como los botones sobre fotos).
- Accesibilidad: controles con nombre accesible, contraste AA, nada interactivo que no sea un
  `<button>` o `<a>`.

**Código muerto**
- Archivos, componentes, métodos, estilos o endpoints que ya nadie usa.

## Paso 4 — Informe

Entregar el informe en la conversación con esta estructura:

1. **Resumen**: estado general en 2–3 frases y resultado de cada chequeo automático.
2. **Hallazgos**, ordenados por prioridad:
   - 🔴 **Alta**: bugs, riesgos de seguridad, chequeos que fallan, duplicación que ya causó o va
     a causar errores.
   - 🟡 **Media**: duplicación relevante, componentes demasiado grandes, patrones mal aplicados.
   - 🟢 **Baja**: nombres, comentarios, estilo, pequeñas limpiezas.

   Cada hallazgo: `ruta:línea` · qué pasa · por qué importa · propuesta concreta · esfuerzo
   (chico / medio / grande).
3. **Lo que está bien**: patrones que conviene mantener (breve, para no romperlos al refactorizar).
4. **Plan sugerido**: los refactors recomendados en orden, cada uno como un commit atómico
   propuesto (mensaje + archivos). No aplicar nada hasta que Marco lo apruebe.

Al terminar, preguntar qué hallazgos se quieren refactorizar. Si el informe es largo, ofrecer
dejarlo como documento para revisarlo con calma.
