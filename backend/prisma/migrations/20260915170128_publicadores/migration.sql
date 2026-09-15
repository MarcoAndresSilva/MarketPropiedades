-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'PERSONA', 'CORREDORA');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
COMMIT;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "contactoNombre",
DROP COLUMN "contactoTipo",
DROP COLUMN "contactoWhatsapp",
ADD COLUMN     "publicadorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "whatsapp" TEXT;

-- DropEnum
DROP TYPE "TipoContacto";

-- CreateTable
CREATE TABLE "CorredoraProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razonSocial" TEXT,
    "rut" TEXT,

    CONSTRAINT "CorredoraProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CorredoraProfile_userId_key" ON "CorredoraProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CorredoraProfile_rut_key" ON "CorredoraProfile"("rut");

-- CreateIndex
CREATE INDEX "Property_publicadorId_idx" ON "Property"("publicadorId");

-- AddForeignKey
ALTER TABLE "CorredoraProfile" ADD CONSTRAINT "CorredoraProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_publicadorId_fkey" FOREIGN KEY ("publicadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

