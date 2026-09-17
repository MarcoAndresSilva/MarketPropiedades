import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto';

// Todo opcional: un PATCH solo manda los campos que cambian.
export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
