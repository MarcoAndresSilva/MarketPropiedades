import { Body, Controller, Get, Post } from '@nestjs/common';
import { SoloAdmin } from '../auth/roles';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

// El admin crea y lista anunciantes; los anunciantes se registran solos en POST /auth/registro.
@SoloAdmin()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto, { verificada: true });
  }

  @Get()
  findAll() {
    return this.users.findAll();
  }
}
