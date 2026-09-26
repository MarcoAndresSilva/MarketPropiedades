-- Rol para inmobiliarias (desarrollan proyectos).
ALTER TYPE "Role" ADD VALUE 'INMOBILIARIA';

-- Título propio de cada propiedad. Se agrega nullable, se completa para las filas
-- existentes con el mismo texto que el frontend armaba hasta ahora ("Casa en Melipilla")
-- y recién después pasa a NOT NULL: agregarla NOT NULL de una fallaría con filas.
ALTER TABLE "Property" ADD COLUMN "titulo" VARCHAR(120);

UPDATE "Property" p
SET "titulo" = (CASE p."tipoPropiedad"
    WHEN 'CASA' THEN 'Casa'
    WHEN 'DEPARTAMENTO' THEN 'Departamento'
    WHEN 'PARCELA' THEN 'Parcela'
    WHEN 'TERRENO' THEN 'Terreno'
    WHEN 'OFICINA' THEN 'Oficina'
    WHEN 'LOCAL_COMERCIAL' THEN 'Local comercial'
    WHEN 'BODEGA' THEN 'Bodega'
  END) || ' en ' || c."nombre"
FROM "Comuna" c
WHERE c."id" = p."comunaId";

ALTER TABLE "Property" ALTER COLUMN "titulo" SET NOT NULL;

-- Verificación de correo para el registro público de anunciantes. Las cuentas que ya
-- existen las creó el equipo a mano (MVP curado), así que se dan por verificadas.
ALTER TABLE "User" ADD COLUMN "emailVerificadoAt" TIMESTAMP(3);
UPDATE "User" SET "emailVerificadoAt" = "createdAt";
