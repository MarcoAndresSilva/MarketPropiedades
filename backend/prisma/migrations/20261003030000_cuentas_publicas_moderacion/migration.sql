-- Etapa 3: cuentas públicas de anunciantes y moderación de publicaciones.
-- Escrita a partir de `prisma migrate diff`, más el backfill del final.

-- CreateEnum
CREATE TYPE "TipoTokenCuenta" AS ENUM ('VERIFICAR_EMAIL', 'RECUPERAR_PASSWORD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoPublicacion" ADD VALUE 'EN_REVISION';
ALTER TYPE "EstadoPublicacion" ADD VALUE 'RECHAZADA';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "motivoRechazo" VARCHAR(500);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordCambiadaAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TokenCuenta" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoTokenCuenta" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraAt" TIMESTAMP(3) NOT NULL,
    "usadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenCuenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenCuenta_tokenHash_key" ON "TokenCuenta"("tokenHash");

-- CreateIndex
CREATE INDEX "TokenCuenta_userId_tipo_idx" ON "TokenCuenta"("userId", "tipo");

-- AddForeignKey
ALTER TABLE "TokenCuenta" ADD CONSTRAINT "TokenCuenta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Hasta hoy todas las cuentas las creó el equipo a mano (admin, seed o POST /users), así
-- que están verificadas. Las creadas después de la migración del 2026-09-26 quedaron sin
-- fecha y sin esto no podrían publicar cuando se exija el correo verificado.
UPDATE "User" SET "emailVerificadoAt" = "createdAt" WHERE "emailVerificadoAt" IS NULL;
