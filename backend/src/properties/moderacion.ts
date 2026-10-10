import { EstadoPublicacion } from '../generated/prisma/enums';

const { BORRADOR, EN_REVISION, RECHAZADA, PUBLICADA, PAUSADA, CERRADA } = EstadoPublicacion;

// Cambios de estado que puede pedir un anunciante sobre su propia propiedad. Nunca llega
// a PUBLICADA por su cuenta: eso lo decide el admin al aprobar. La excepción es reanudar
// una pausada, porque su contenido ya fue aprobado (editarla la manda a revisión, ver
// estadoTrasEditar). El admin no pasa por acá: cambia el estado con el PATCH del panel.
const TRANSICIONES_ANUNCIANTE: Record<EstadoPublicacion, EstadoPublicacion[]> = {
  [BORRADOR]: [EN_REVISION],
  [RECHAZADA]: [EN_REVISION],
  [EN_REVISION]: [BORRADOR],
  [PUBLICADA]: [PAUSADA, CERRADA],
  [PAUSADA]: [PUBLICADA, CERRADA],
  [CERRADA]: [],
};

export function puedeCambiarEstado(desde: EstadoPublicacion, hacia: EstadoPublicacion): boolean {
  return TRANSICIONES_ANUNCIANTE[desde].includes(hacia);
}

/**
 * Estado en que queda una propiedad después de que su anunciante cambia el contenido
 * (datos o fotos nuevas). Si ya estaba aprobada vuelve a revisión, o un anunciante podría
 * publicar algo aprobado y después cambiarlo por cualquier cosa. En el resto de los
 * estados el contenido todavía no es público y no cambia nada.
 */
export function estadoTrasEditar(actual: EstadoPublicacion): EstadoPublicacion {
  return actual === PUBLICADA || actual === PAUSADA ? EN_REVISION : actual;
}
