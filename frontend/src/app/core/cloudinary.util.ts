import { environment } from '../../environments/environment';

/**
 * URL de entrega de Cloudinary para una foto ya subida, con recorte fijo.
 *
 * Si `publicId` ya es una URL completa (ej. una foto de relleno servida como asset
 * estático del propio frontend, `/demo-fotos/foto-1.svg`), se devuelve tal cual — no
 * tiene sentido pasarla por la transformación de Cloudinary. Esto es temporal:
 * hasta que exista una cuenta real de Cloudinary, `PropertyFoto.cloudinaryPublicId`
 * puede guardar una ruta de relleno en vez de un publicId real.
 */
export function cloudinaryImageUrl(publicId: string, width = 480, height = 320): string {
  if (publicId.startsWith('http') || publicId.startsWith('/')) {
    return publicId;
  }
  return `https://res.cloudinary.com/${environment.cloudinaryCloudName}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${publicId}`;
}
