import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto';

// Lo que el anunciante carga de su propiedad. Sin `publicadorId` (siempre es su cuenta),
// sin `estado` (se cambia con PATCH /mis-propiedades/:id/estado, que valida la
// transición) y sin `destacada` (es un servicio pagado que asigna el admin).
export class CreatePropiedadAnuncianteDto extends OmitType(CreatePropertyDto, [
  'publicadorId',
  'estado',
  'destacada',
] as const) {}

export class UpdatePropiedadAnuncianteDto extends PartialType(CreatePropiedadAnuncianteDto) {}
