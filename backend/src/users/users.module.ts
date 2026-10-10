import { Module } from '@nestjs/common';
import { PassportJwtModule } from '../auth/passport';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PassportJwtModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
