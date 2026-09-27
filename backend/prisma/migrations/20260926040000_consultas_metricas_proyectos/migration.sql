-- Etapa 2: consultas desde la ficha, métricas por propiedad y proyectos inmobiliarios.

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('VISTA', 'CLIC_WHATSAPP', 'FAVORITO');

-- CreateEnum
CREATE TYPE "EtapaProyecto" AS ENUM ('EN_PLANIFICACION', 'EN_CONSTRUCCION', 'ENTREGA_INMEDIATA');

-- CreateTable
CREATE TABLE "Consulta" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(200),
    "telefono" VARCHAR(30),
    "mensaje" VARCHAR(2000) NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoPropiedad" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "visitante" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoPropiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "estado" "EstadoPublicacion" NOT NULL DEFAULT 'BORRADOR',
    "publicadorId" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "etapa" "EtapaProyecto" NOT NULL,
    "entrega" VARCHAR(60),
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "comunaId" TEXT NOT NULL,
    "direccion" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "descripcion" TEXT NOT NULL,
    "precioDesdeUf" DECIMAL(12,2),
    "dormitoriosMin" INTEGER,
    "dormitoriosMax" INTEGER,
    "banosMin" INTEGER,
    "banosMax" INTEGER,
    "m2Min" DOUBLE PRECISION,
    "m2Max" DOUBLE PRECISION,
    "unidades" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoFoto" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "ProyectoFoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consulta_propertyId_createdAt_idx" ON "Consulta"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "EventoPropiedad_propertyId_tipo_idx" ON "EventoPropiedad"("propertyId", "tipo");

-- CreateIndex
CREATE INDEX "EventoPropiedad_propertyId_tipo_visitante_createdAt_idx" ON "EventoPropiedad"("propertyId", "tipo", "visitante", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_slug_key" ON "Proyecto"("slug");

-- CreateIndex
CREATE INDEX "Proyecto_comunaId_idx" ON "Proyecto"("comunaId");

-- CreateIndex
CREATE INDEX "Proyecto_publicadorId_idx" ON "Proyecto"("publicadorId");

-- CreateIndex
CREATE INDEX "Proyecto_estado_destacado_idx" ON "Proyecto"("estado", "destacado");

-- CreateIndex
CREATE INDEX "ProyectoFoto_proyectoId_idx" ON "ProyectoFoto"("proyectoId");

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoPropiedad" ADD CONSTRAINT "EventoPropiedad_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_publicadorId_fkey" FOREIGN KEY ("publicadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "Comuna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoFoto" ADD CONSTRAINT "ProyectoFoto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

