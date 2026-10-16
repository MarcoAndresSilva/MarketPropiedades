import { EstadoPublicacion, Role } from '../generated/prisma/enums';
import type { PrismaService } from '../prisma/prisma.service';
import type { MailService } from '../mail/mail.service';
import type { PlantillasCorreo } from '../mail/plantillas-correo';
import type { AuthUser } from '../auth/current-user.decorator';
import type { PropertiesService } from './properties.service';
import { MisPropiedadesService } from './mis-propiedades.service';

const anunciante: AuthUser = {
  id: 'u1',
  email: 'ana@example.com',
  name: 'Ana',
  role: Role.PERSONA,
  emailVerificado: true,
};

// Dobles mínimos: lo que se prueba es cuándo se avisa a los admins, no Prisma ni el correo.
function armar(estadoActual: EstadoPublicacion) {
  const prisma = {
    property: {
      findFirst: vi.fn().mockResolvedValue({ id: 'p1', titulo: 'Casa', estado: estadoActual }),
      update: vi.fn().mockResolvedValue({}),
    },
    user: { findMany: vi.fn().mockResolvedValue([{ email: 'admin@example.com' }]) },
  };
  const properties = {
    update: vi.fn().mockResolvedValue({ id: 'p1', titulo: 'Casa' }),
    addFoto: vi.fn().mockResolvedValue({ id: 'f1' }),
  };
  const mail = { enviar: vi.fn().mockResolvedValue(undefined) };
  const plantillas = { propiedadParaRevisar: vi.fn().mockReturnValue({}) };
  const service = new MisPropiedadesService(
    prisma as unknown as PrismaService,
    properties as unknown as PropertiesService,
    mail as unknown as MailService,
    plantillas as unknown as PlantillasCorreo,
  );
  return { service, mail };
}

describe('MisPropiedadesService: aviso a los admins al volver a revisión', () => {
  it('editar una propiedad publicada avisa, porque deja de verse en el catálogo', async () => {
    const { service, mail } = armar(EstadoPublicacion.PUBLICADA);
    await service.update('p1', { titulo: 'Casa nueva' }, anunciante);
    expect(mail.enviar).toHaveBeenCalledTimes(1);
  });

  it('agregar una foto a una pausada también avisa', async () => {
    const { service, mail } = armar(EstadoPublicacion.PAUSADA);
    await service.addFoto('p1', { cloudinaryPublicId: 'x', orden: 0 }, anunciante);
    expect(mail.enviar).toHaveBeenCalledTimes(1);
  });

  it('editar un borrador no avisa: todavía no se envió a revisión', async () => {
    const { service, mail } = armar(EstadoPublicacion.BORRADOR);
    await service.update('p1', { titulo: 'Casa nueva' }, anunciante);
    expect(mail.enviar).not.toHaveBeenCalled();
  });

  it('editar una que ya está en revisión no repite el aviso', async () => {
    const { service, mail } = armar(EstadoPublicacion.EN_REVISION);
    await service.update('p1', { titulo: 'Casa nueva' }, anunciante);
    expect(mail.enviar).not.toHaveBeenCalled();
  });
});
