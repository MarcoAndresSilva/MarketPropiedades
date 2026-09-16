import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protege un endpoint: exige `Authorization: Bearer <token>` válido. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
