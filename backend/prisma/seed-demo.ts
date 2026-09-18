import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client';

// Datos de DESARROLLO para ver la grilla y la ficha del catálogo con contenido real —
// nunca correr esto contra la base de producción. Idempotente: usa upsert por
// email/slug, se puede correr las veces que haga falta sin duplicar nada.
//
// Las fotos son rutas a SVG de relleno servidos por el propio frontend
// (frontend/public/demo-fotos/), no Cloudinary real — todavía no existe esa cuenta.
// `cloudinaryImageUrl()` en el frontend detecta que ya son URLs completas y las usa
// tal cual, sin pasarlas por la transformación de Cloudinary.

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_PUBLICADOR = {
  email: 'demo@marketpropiedades.cl',
  name: 'Corredora Demo',
  whatsapp: '+56912345678',
  razonSocial: 'Demo Propiedades SpA',
  rut: '11.111.111-1',
};

// Melipilla + comunas vecinas reales (misma zona poniente de la Región Metropolitana) —
// para poder probar el filtro de comuna del catálogo con más de una opción real, en vez
// de simular un dato que no existiría en producción con este mismo volumen de datos.
const MELIPILLA = '13501';
const SAN_PEDRO = '13505';
const TALAGANTE = '13601';
const EL_MONTE = '13602';

const FOTOS = ['/demo-fotos/foto-1.svg', '/demo-fotos/foto-2.svg', '/demo-fotos/foto-3.svg', '/demo-fotos/foto-4.svg'];

// Video público de muestra (cortometraje libre de Blender Foundation) — sirve para
// probar que el reproductor funciona, no es una visita real a la propiedad.
const VIDEO_DEMO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const DEMO_PROPERTIES = [
  {
    slug: 'demo-casa-melipilla-centro',
    comunaId: MELIPILLA,
    tipoOperacion: 'VENTA',
    tipoPropiedad: 'CASA',
    destacada: true,
    precioUf: 4200,
    dormitorios: 4,
    banos: 3,
    m2Construidos: 150,
    m2Terreno: 300,
    direccion: 'Sector centro',
    descripcion:
      'Casa amplia de 4 dormitorios con patio grande, ideal para familia. Ubicada a pasos del centro de Melipilla, cerca de colegios y locomoción.',
    videoUrl: VIDEO_DEMO,
    fotos: FOTOS,
  },
  {
    slug: 'demo-depto-melipilla-plaza',
    comunaId: MELIPILLA,
    tipoOperacion: 'ARRIENDO',
    tipoPropiedad: 'DEPARTAMENTO',
    destacada: false,
    precioClp: 420000,
    dormitorios: 2,
    banos: 1,
    m2Construidos: 55,
    estacionamientos: 1,
    gastosComunesClp: 45000,
    descripcion: 'Departamento de 2 dormitorios, luminoso, cerca de la plaza de Melipilla. Incluye estacionamiento.',
    fotos: FOTOS.slice(0, 3),
  },
  {
    slug: 'demo-parcela-melipilla-rural',
    comunaId: MELIPILLA,
    tipoOperacion: 'VENTA',
    tipoPropiedad: 'PARCELA',
    destacada: true,
    precioUf: 8500,
    m2Terreno: 5000,
    descripcion:
      'Parcela de 5.000 m² en sector rural de Melipilla, con acceso a agua de pozo. Ideal para segunda vivienda o proyecto agrícola.',
    fotos: FOTOS.slice(0, 2),
  },
  {
    slug: 'demo-oficina-melipilla-centro',
    comunaId: MELIPILLA,
    tipoOperacion: 'ARRIENDO',
    tipoPropiedad: 'OFICINA',
    destacada: false,
    precioClp: 350000,
    m2Construidos: 40,
    gastosComunesClp: 30000,
    descripcion: 'Oficina de 40 m² en pleno centro de Melipilla, primer piso, ideal para atención de público.',
    fotos: FOTOS.slice(0, 1),
  },
  {
    slug: 'demo-local-melipilla-avenida',
    comunaId: MELIPILLA,
    tipoOperacion: 'VENTA',
    tipoPropiedad: 'LOCAL_COMERCIAL',
    destacada: false,
    precioUf: 3800,
    m2Construidos: 80,
    descripcion: 'Local comercial de 80 m² sobre avenida principal, alto flujo peatonal y vehicular.',
    fotos: [] as string[],
  },
  {
    slug: 'demo-casa-san-pedro-vista-cerro',
    comunaId: SAN_PEDRO,
    tipoOperacion: 'VENTA',
    tipoPropiedad: 'CASA',
    destacada: false,
    precioUf: 3100,
    dormitorios: 3,
    banos: 2,
    m2Construidos: 110,
    m2Terreno: 200,
    descripcion: 'Casa de 3 dormitorios en San Pedro, sector tranquilo con vista a los cerros. A 25 minutos de Melipilla.',
    fotos: FOTOS.slice(0, 2),
  },
  {
    slug: 'demo-parcela-san-pedro-agricola',
    comunaId: SAN_PEDRO,
    tipoOperacion: 'VENTA',
    tipoPropiedad: 'PARCELA',
    destacada: false,
    precioUf: 6200,
    m2Terreno: 8000,
    descripcion: 'Parcela agrícola de 8.000 m² en San Pedro, con pozo profundo y derechos de agua al día.',
    fotos: FOTOS.slice(0, 1),
  },
  {
    slug: 'demo-depto-talagante-centro',
    comunaId: TALAGANTE,
    tipoOperacion: 'ARRIENDO',
    tipoPropiedad: 'DEPARTAMENTO',
    destacada: true,
    precioClp: 380000,
    dormitorios: 2,
    banos: 1,
    m2Construidos: 48,
    estacionamientos: 1,
    gastosComunesClp: 38000,
    descripcion: 'Departamento de 2 dormitorios a pasos de la estación de Talagante, ideal para quien viaja a Santiago.',
    fotos: FOTOS.slice(0, 3),
  },
  {
    slug: 'demo-bodega-talagante-industrial',
    comunaId: TALAGANTE,
    tipoOperacion: 'ARRIENDO',
    tipoPropiedad: 'BODEGA',
    destacada: false,
    precioClp: 650000,
    m2Construidos: 200,
    descripcion: 'Bodega de 200 m² en sector industrial de Talagante, con acceso para camión y altura libre de 6 metros.',
    fotos: [] as string[],
  },
  {
    slug: 'demo-casa-el-monte-rio',
    comunaId: EL_MONTE,
    tipoOperacion: 'VENTA',
    tipoPropiedad: 'CASA',
    destacada: false,
    precioUf: 3600,
    dormitorios: 3,
    banos: 2,
    m2Construidos: 130,
    m2Terreno: 400,
    descripcion: 'Casa de 3 dormitorios cerca del río Maipo en El Monte, patio amplio con árboles frutales.',
    fotos: FOTOS.slice(0, 2),
  },
] as const;

async function main() {
  const passwordHash = await argon2.hash('demo12345');

  const publicador = await prisma.user.upsert({
    where: { email: DEMO_PUBLICADOR.email },
    update: {},
    create: {
      email: DEMO_PUBLICADOR.email,
      passwordHash,
      name: DEMO_PUBLICADOR.name,
      whatsapp: DEMO_PUBLICADOR.whatsapp,
      role: 'CORREDORA',
      corredoraProfile: {
        create: { razonSocial: DEMO_PUBLICADOR.razonSocial, rut: DEMO_PUBLICADOR.rut },
      },
    },
  });

  for (const { fotos, ...p } of DEMO_PROPERTIES) {
    const property = await prisma.property.upsert({
      where: { slug: p.slug },
      update: { estado: 'PUBLICADA', videoUrl: 'videoUrl' in p ? p.videoUrl : null },
      create: {
        ...p,
        estado: 'PUBLICADA',
        publicadorId: publicador.id,
      },
    });

    // Re-sembrar fotos desde cero es más simple que hacer upsert foto por foto.
    await prisma.propertyFoto.deleteMany({ where: { propertyId: property.id } });
    if (fotos.length > 0) {
      await prisma.propertyFoto.createMany({
        data: fotos.map((cloudinaryPublicId, orden) => ({ propertyId: property.id, cloudinaryPublicId, orden })),
      });
    }
  }

  console.log(`Listo: publicador "${publicador.email}" + ${DEMO_PROPERTIES.length} propiedades PUBLICADA con fotos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
