import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../generated/prisma/enums';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  whatsapp: true,
  role: true,
  corredoraProfile: { select: { razonSocial: true, rut: true } },
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese email.');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        whatsapp: dto.whatsapp,
        role: dto.role,
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
      where: { role: { in: [Role.PERSONA, Role.CORREDORA] } },
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }
}
