import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../generated/prisma/enums';
import { ROLES_ANUNCIANTE } from '../auth/roles';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  whatsapp: true,
  role: true,
  emailVerificadoAt: true,
  corredoraProfile: { select: { razonSocial: true, rut: true } },
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una cuenta de anunciante. Las que crea el admin nacen verificadas (las armó el
   * equipo con datos que ya conoce); las del registro público, sin verificar hasta que
   * el dueño abra el link del correo.
   */
  async create(dto: CreateUserDto, { verificada }: { verificada: boolean }) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese email.');
    }
    // El RUT es único: sin este chequeo, un duplicado llegaba a Prisma como 500.
    if (dto.role === Role.CORREDORA && dto.rut) {
      const rutTomado = await this.prisma.corredoraProfile.findUnique({ where: { rut: dto.rut } });
      if (rutTomado) {
        throw new ConflictException('Ya existe una corredora con ese RUT.');
      }
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        whatsapp: dto.whatsapp,
        role: dto.role,
        emailVerificadoAt: verificada ? new Date() : null,
        corredoraProfile:
          dto.role === Role.CORREDORA
            ? { create: { razonSocial: dto.razonSocial, rut: dto.rut } }
            : undefined,
      },
      select: PUBLIC_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      where: { role: { in: [...ROLES_ANUNCIANTE] } },
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }
}
