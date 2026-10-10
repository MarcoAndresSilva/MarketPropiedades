import { PassportModule } from '@nestjs/passport';

// Todo módulo con endpoints protegidos lo necesita: AuthGuard('jwt') inyecta las opciones
// que solo provee `.register()` (ver ARCHITECTURE.md, Fase 4). Los módulos lo reciben al
// importar AuthModule; UsersModule lo importa directo porque AuthModule depende de él.
export const PassportJwtModule = PassportModule.register({ defaultStrategy: 'jwt' });
