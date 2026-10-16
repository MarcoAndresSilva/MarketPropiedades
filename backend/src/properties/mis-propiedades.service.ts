import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PlantillasCorreo } from '../mail/plantillas-correo';
import { EstadoPublicacion, Role } from '../generated/prisma/enums';
import { AuthUser } from '../auth/current-user.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropiedadAnuncianteDto, UpdatePropiedadAnuncianteDto } from './dto/propiedad-anunciante.dto';
import { CreatePropertyFotoDto } from './dto/create-property-foto.dto';
import { estadoTrasEditar, puedeCambiarEstado } from './moderacion';

const MIS_INCLUDE = {
  comuna: { include: { region: true } },
  fotos: { orderBy: { orden: 'asc' as const } },
};

// Propiedades de un anunciante sobre su propia cuenta. Toda operación parte de
// `findPropia`, que busca por id Y publicador: una propiedad ajena responde 404, igual que
// una que no existe, para no revelar qué ids hay. La lógica de precio, slug y fotos es la
// misma del admin (PropertiesService); acá solo se agregan la propiedad y la moderación.
@Injectable()
export class MisPropiedadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly properties: PropertiesService,
    private readonly mail: MailService,
    private readonly plantillas: PlantillasCorreo,
  ) {}

  findAll(userId: string) {
    return this.prisma.property.findMany({
      where: { publicadorId: userId },
      include: MIS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const property = await this.prisma.property.findFirst({ where: { id, publicadorId: userId }, include: MIS_INCLUDE });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada.');
    }
    return property;
  }

  /** Nace como borrador: el anunciante la completa, le sube fotos y la envía a revisión. */
  create(dto: CreatePropiedadAnuncianteDto, userId: string) {
    return this.properties.create({ ...dto, publicadorId: userId, estado: EstadoPublicacion.BORRADOR });
  }

  async update(id: string, dto: UpdatePropiedadAnuncianteDto, user: AuthUser) {
    const actual = await this.findPropia(id, user.id);
    const estado = estadoTrasEditar(actual.estado);
    const property = await this.properties.update(id, { ...dto, estado });
    await this.avisarSiVuelveARevision(actual.estado, estado, property.titulo, user.name);
    return property;
  }

  async cambiarEstado(id: string, estado: EstadoPublicacion, user: AuthUser) {
    const actual = await this.findPropia(id, user.id);
    if (!puedeCambiarEstado(actual.estado, estado)) {
      throw new BadRequestException(`No se puede pasar de ${actual.estado} a ${estado}.`);
    }

    const enviada = estado === EstadoPublicacion.EN_REVISION;
    const property = await this.prisma.property.update({
      where: { id },
      // Al reenviarla, el motivo del rechazo anterior ya no aplica.
      data: { estado, motivoRechazo: enviada ? null : undefined },
      include: MIS_INCLUDE,
    });
    if (enviada) {
      await this.avisarAdmins(property.titulo, user.name);
    }
    return property;
  }

  async remove(id: string, userId: string) {
    await this.findPropia(id, userId);
    return this.properties.remove(id);
  }

  /** Una foto nueva es contenido nuevo: si la propiedad estaba aprobada, vuelve a revisión. */
  async addFoto(id: string, dto: CreatePropertyFotoDto, user: AuthUser) {
    const actual = await this.findPropia(id, user.id);
    const foto = await this.properties.addFoto(id, dto);
    const estado = estadoTrasEditar(actual.estado);
    if (estado !== actual.estado) {
      await this.prisma.property.update({ where: { id }, data: { estado } });
    }
    await this.avisarSiVuelveARevision(actual.estado, estado, actual.titulo, user.name);
    return foto;
  }

  async removeFoto(fotoId: string, userId: string) {
    const foto = await this.prisma.propertyFoto.findFirst({
      where: { id: fotoId, property: { publicadorId: userId } },
      select: { id: true },
    });
    if (!foto) {
      throw new NotFoundException('Foto no encontrada.');
    }
    return this.properties.removeFoto(fotoId);
  }

  private async findPropia(id: string, userId: string) {
    const property = await this.prisma.property.findFirst({ where: { id, publicadorId: userId } });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada.');
    }
    return property;
  }

  /**
   * Editar algo aprobado lo saca del catálogo hasta que el admin lo vuelva a aprobar
   * (estadoTrasEditar). Sin este aviso la propiedad quedaba oculta hasta que alguien
   * entrara por casualidad a la cola.
   */
  private async avisarSiVuelveARevision(antes: EstadoPublicacion, despues: EstadoPublicacion, titulo: string, anunciante: string) {
    if (antes !== despues && despues === EstadoPublicacion.EN_REVISION) {
      await this.avisarAdmins(titulo, anunciante);
    }
  }

  private async avisarAdmins(titulo: string, anunciante: string) {
    const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN }, select: { email: true } });
    await Promise.all(admins.map((a) => this.mail.enviar(this.plantillas.propiedadParaRevisar(a.email, titulo, anunciante))));
  }
}
