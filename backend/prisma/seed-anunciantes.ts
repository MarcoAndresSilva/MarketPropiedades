import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client';
import { EstadoPublicacion, Role, TipoOperacion, TipoPropiedad } from '../src/generated/prisma/enums';

// Cuentas de anunciante de DESARROLLO, una por tipo y con propiedades en cada estado de
// moderación, para recorrer el panel del anunciante y la cola de revisión del admin
// sin registrarse a mano. Nunca correr contra producción. Idempotente: upsert por email
// y slug. Los correos son @example.com (dominio reservado): aunque haya RESEND_API_KEY
// en local, ningún aviso llega a una casilla real.

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PASSWORD = 'demo12345';
const MELIPILLA = '13501';
const FOTOS = ['/demo-fotos/foto-1.svg', '/demo-fotos/foto-2.svg', '/demo-fotos/foto-3.svg'];

interface PropiedadDemo {
  slug: string;
  titulo: string;
  estado: EstadoPublicacion;
  motivoRechazo?: string;
  tipoOperacion: TipoOperacion;
  tipoPropiedad: TipoPropiedad;
  precioUf?: number;
  precioClp?: number;
  dormitorios?: number;
  banos?: number;
  m2Construidos?: number;
  m2Terreno?: number;
  descripcion: string;
  fotos: string[];
}

interface CuentaDemo {
  email: string;
  name: string;
  role: Role;
  whatsapp: string;
  verificada: boolean;
  propiedades: PropiedadDemo[];
}

const CUENTAS: CuentaDemo[] = [
  {
    email: 'propietario@example.com',
    name: 'Ana Propietaria',
    role: Role.PERSONA,
    whatsapp: '+56911111111',
    verificada: true,
    // Una propiedad en cada estado, para ver todos los botones del panel.
    propiedades: [
      {
        slug: 'demo-anunciante-borrador',
        titulo: 'Casa en Pomaire sin terminar de cargar',
        estado: EstadoPublicacion.BORRADOR,
        tipoOperacion: TipoOperacion.VENTA,
        tipoPropiedad: TipoPropiedad.CASA,
        precioUf: 2800,
        dormitorios: 3,
        descripcion: 'Borrador de ejemplo: todavía no tiene fotos, así que no se puede enviar a revisión.',
        fotos: [],
      },
      {
        slug: 'demo-anunciante-en-revision',
        titulo: 'Parcela con vista al cerro en Codigua',
        estado: EstadoPublicacion.EN_REVISION,
        tipoOperacion: TipoOperacion.VENTA,
        tipoPropiedad: TipoPropiedad.PARCELA,
        precioUf: 1900,
        m2Terreno: 5000,
        descripcion: 'Parcela de 5.000 m² con agua de pozo y luz, a 10 minutos de Melipilla.',
        fotos: FOTOS,
      },
      {
        slug: 'demo-anunciante-rechazada',
        titulo: 'Departamento en arriendo cerca del hospital',
        estado: EstadoPublicacion.RECHAZADA,
        motivoRechazo: 'Las fotos están muy oscuras y falta indicar los gastos comunes. Corrígelo y vuelve a enviarla.',
        tipoOperacion: TipoOperacion.ARRIENDO,
        tipoPropiedad: TipoPropiedad.DEPARTAMENTO,
        precioClp: 380000,
        dormitorios: 2,
        banos: 1,
        descripcion: 'Departamento de 2 dormitorios a pasos del hospital de Melipilla, con estacionamiento.',
        fotos: FOTOS.slice(0, 1),
      },
      {
        slug: 'demo-anunciante-publicada',
        titulo: 'Casa con quincho en villa tranquila',
        estado: EstadoPublicacion.PUBLICADA,
        tipoOperacion: TipoOperacion.VENTA,
        tipoPropiedad: TipoPropiedad.CASA,
        precioUf: 3400,
        dormitorios: 3,
        banos: 2,
        m2Construidos: 95,
        m2Terreno: 200,
        descripcion: 'Casa de 3 dormitorios con quincho y patio, en villa con áreas verdes y poco tránsito.',
        fotos: FOTOS,
      },
      {
        slug: 'demo-anunciante-pausada',
        titulo: 'Local comercial en calle Ortúzar',
        estado: EstadoPublicacion.PAUSADA,
        tipoOperacion: TipoOperacion.ARRIENDO,
        tipoPropiedad: TipoPropiedad.LOCAL_COMERCIAL,
        precioClp: 650000,
        m2Construidos: 60,
        descripcion: 'Local de 60 m² con vitrina a la calle y baño, en pleno centro comercial de Melipilla.',
        fotos: FOTOS.slice(0, 2),
      },
      {
        slug: 'demo-anunciante-cerrada',
        titulo: 'Terreno vendido en Huechún',
        estado: EstadoPublicacion.CERRADA,
        tipoOperacion: TipoOperacion.VENTA,
        tipoPropiedad: TipoPropiedad.TERRENO,
        precioUf: 900,
        m2Terreno: 1200,
        descripcion: 'Terreno plano de 1.200 m² con factibilidad de agua y luz. Ya fue vendido.',
        fotos: FOTOS.slice(0, 1),
      },
    ],
  },
  {
    email: 'corredora@example.com',
    name: 'Corredora Los Aromos',
    role: Role.CORREDORA,
    whatsapp: '+56922222222',
    verificada: true,
    propiedades: [
      {
        slug: 'demo-anunciante-corredora-revision',
        titulo: 'Casa amplia para familia grande en Melipilla',
        estado: EstadoPublicacion.EN_REVISION,
        tipoOperacion: TipoOperacion.VENTA,
        tipoPropiedad: TipoPropiedad.CASA,
        precioUf: 4100,
        dormitorios: 5,
        banos: 3,
        m2Construidos: 180,
        descripcion: 'Casa de 5 dormitorios con piscina y bodega, ideal para familia grande.',
        fotos: FOTOS,
      },
    ],
  },
  {
    email: 'inmobiliaria@example.com',
    name: 'Inmobiliaria Valle Poniente',
    role: Role.INMOBILIARIA,
    whatsapp: '+56933333333',
    verificada: true,
    propiedades: [],
  },
  {
    // Recién registrada: ve el aviso de "confirma tu correo" y no puede publicar.
    email: 'sinverificar@example.com',
    name: 'Pedro Sin Verificar',
    role: Role.PERSONA,
    whatsapp: '+56944444444',
    verificada: false,
    propiedades: [],
  },
];

async function main() {
  const passwordHash = await argon2.hash(PASSWORD);

  for (const { propiedades, verificada, ...cuenta } of CUENTAS) {
    const datosCuenta = { ...cuenta, emailVerificadoAt: verificada ? new Date() : null };
    const user = await prisma.user.upsert({
      where: { email: cuenta.email },
      update: datosCuenta,
      create: { ...datosCuenta, passwordHash },
    });

    for (const { fotos, ...p } of propiedades) {
      const data = {
        ...p,
        comunaId: MELIPILLA,
        motivoRechazo: p.motivoRechazo ?? null,
        // Ventas de demo en UF: su referencia para filtrar es el mismo valor.
        precioRefUf: p.tipoOperacion === TipoOperacion.VENTA ? (p.precioUf ?? null) : null,
      };
      const property = await prisma.property.upsert({
        where: { slug: p.slug },
        update: { ...data, publicadorId: user.id },
        create: { ...data, publicadorId: user.id },
      });

      await prisma.propertyFoto.deleteMany({ where: { propertyId: property.id } });
      if (fotos.length > 0) {
        await prisma.propertyFoto.createMany({
          data: fotos.map((cloudinaryPublicId, orden) => ({ propertyId: property.id, cloudinaryPublicId, orden })),
        });
      }
    }
  }

  console.log(`Listo: ${CUENTAS.length} cuentas de anunciante (contraseña "${PASSWORD}").`);
  for (const c of CUENTAS) {
    console.log(`  ${c.email.padEnd(26)} ${c.role.padEnd(13)} ${c.verificada ? 'verificada' : 'SIN verificar'} · ${c.propiedades.length} propiedades`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
