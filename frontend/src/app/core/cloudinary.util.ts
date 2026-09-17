import { environment } from '../../environments/environment';

/** URL de entrega de Cloudinary para una foto ya subida, con recorte fijo para la grilla. */
export function cloudinaryImageUrl(publicId: string, width = 480, height = 320): string {
  return `https://res.cloudinary.com/${environment.cloudinaryCloudName}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${publicId}`;
}
