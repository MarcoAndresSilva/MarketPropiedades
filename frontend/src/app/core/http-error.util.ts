import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mensaje legible para un error de la API. class-validator (backend) devuelve el detalle
 * exacto en `error.message`, uno por campo ("titulo should not be empty"); mostrarlo tal
 * cual le dice a quien completa el formulario qué corregir, en vez de una frase genérica.
 */
export function mensajeDeErrorHttp(err: HttpErrorResponse, accion = 'guardar'): string {
  const detalle = err.error?.message;
  if (Array.isArray(detalle) && detalle.length > 0) {
    return `No se pudo ${accion}: ${detalle.join(' · ')}`;
  }
  if (typeof detalle === 'string') {
    return `No se pudo ${accion}: ${detalle}`;
  }
  if (err.status === 0) {
    return `No se pudo ${accion}: no hay conexión con el servidor.`;
  }
  return `No se pudo ${accion} (error ${err.status}). Intenta de nuevo.`;
}
