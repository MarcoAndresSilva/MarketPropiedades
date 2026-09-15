-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PERSONA', 'AGENTE_CORREDORA');

-- CreateEnum
CREATE TYPE "TipoOperacion" AS ENUM ('VENTA', 'ARRIENDO');

-- CreateEnum
CREATE TYPE "TipoPropiedad" AS ENUM ('CASA', 'DEPARTAMENTO', 'PARCELA', 'TERRENO', 'OFICINA', 'LOCAL_COMERCIAL', 'BODEGA');

-- CreateEnum
CREATE TYPE "EstadoPublicacion" AS ENUM ('BORRADOR', 'PUBLICADA', 'PAUSADA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoContacto" AS ENUM ('PROPIETARIO', 'CORREDORA');

-- CreateTable
CREATE TABLE "Region" (
    "id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comuna" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,

    CONSTRAINT "Comuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "estado" "EstadoPublicacion" NOT NULL DEFAULT 'BORRADOR',
    "tipoOperacion" "TipoOperacion" NOT NULL,
    "tipoPropiedad" "TipoPropiedad" NOT NULL,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "comunaId" TEXT NOT NULL,
    "direccion" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "precioUf" DECIMAL(12,2),
    "precioClp" INTEGER,
    "m2Construidos" DOUBLE PRECISION,
    "m2Terreno" DOUBLE PRECISION,
    "dormitorios" INTEGER,
    "banos" INTEGER,
    "estacionamientos" INTEGER,
    "bodegas" INTEGER,
    "gastosComunesClp" INTEGER,
    "descripcion" TEXT NOT NULL,
    "contactoTipo" "TipoContacto" NOT NULL,
    "contactoNombre" TEXT NOT NULL,
    "contactoWhatsapp" TEXT NOT NULL,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyFoto" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "PropertyFoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_nombre_key" ON "Region"("nombre");

-- CreateIndex
CREATE INDEX "Comuna_regionId_idx" ON "Comuna"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Comuna_nombre_regionId_key" ON "Comuna"("nombre", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_comunaId_idx" ON "Property"("comunaId");

-- CreateIndex
CREATE INDEX "Property_tipoOperacion_tipoPropiedad_estado_idx" ON "Property"("tipoOperacion", "tipoPropiedad", "estado");

-- CreateIndex
CREATE INDEX "PropertyFoto_propertyId_idx" ON "PropertyFoto"("propertyId");

-- AddForeignKey
ALTER TABLE "Comuna" ADD CONSTRAINT "Comuna_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "Comuna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyFoto" ADD CONSTRAINT "PropertyFoto_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
