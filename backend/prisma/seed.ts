import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import regiones from './seed-data/regiones-comunas.json';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  for (const region of regiones) {
    await prisma.region.upsert({
      where: { id: region.value },
      update: { nombre: region.name },
      create: { id: region.value, nombre: region.name },
    });

    for (const comuna of region.comunas) {
      await prisma.comuna.upsert({
        where: { id: comuna.value },
        update: { nombre: comuna.name, regionId: region.value },
        create: { id: comuna.value, nombre: comuna.name, regionId: region.value },
      });
    }
  }

  const [totalRegiones, totalComunas] = await Promise.all([
    prisma.region.count(),
    prisma.comuna.count(),
  ]);
  console.log(`Sembradas ${totalRegiones} regiones y ${totalComunas} comunas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
