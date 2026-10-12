import { EstadoPublicacion } from './property.model';

/** Cómo se nombra cada estado en pantalla, y qué significa para quien publicó. */
export const ESTADO_PUBLICACION: Record<EstadoPublicacion, { etiqueta: string; detalle: string }> = {
  BORRADOR: { etiqueta: 'Borrador', detalle: 'Solo tú la ves. Envíala a revisión cuando esté lista.' },
  EN_REVISION: { etiqueta: 'En revisión', detalle: 'Nuestro equipo la está revisando. Te avisamos por correo.' },
  RECHAZADA: { etiqueta: 'Rechazada', detalle: 'Corrige lo que te indicamos y vuelve a enviarla.' },
  PUBLICADA: { etiqueta: 'Publicada', detalle: 'Visible en Habbi.' },
  PAUSADA: { etiqueta: 'Pausada', detalle: 'Oculta del catálogo. Puedes reanudarla cuando quieras.' },
  CERRADA: { etiqueta: 'Cerrada', detalle: 'Vendida o arrendada. Ya no se muestra.' },
};

export interface AccionEstado {
  hacia: EstadoPublicacion;
  etiqueta: string;
  /** Pregunta antes de ejecutarla, para las que no tienen vuelta atrás. */
  confirmar?: string;
}

/**
 * Los cambios de estado que puede pedir un anunciante, los mismos de
 * `backend/src/properties/moderacion.ts`. Acá solo deciden qué botones mostrar: si la
 * tabla quedara desfasada, el backend rechaza la transición con 400.
 */
export const ACCIONES_ANUNCIANTE: Record<EstadoPublicacion, AccionEstado[]> = {
  BORRADOR: [{ hacia: 'EN_REVISION', etiqueta: 'Enviar a revisión' }],
  RECHAZADA: [{ hacia: 'EN_REVISION', etiqueta: 'Reenviar a revisión' }],
  EN_REVISION: [{ hacia: 'BORRADOR', etiqueta: 'Retirar de revisión' }],
  PUBLICADA: [
    { hacia: 'PAUSADA', etiqueta: 'Pausar' },
    { hacia: 'CERRADA', etiqueta: 'Marcar vendida o arrendada', confirmar: 'Una propiedad cerrada no se puede volver a publicar. ¿Continuar?' },
  ],
  PAUSADA: [
    { hacia: 'PUBLICADA', etiqueta: 'Reanudar' },
    { hacia: 'CERRADA', etiqueta: 'Marcar vendida o arrendada', confirmar: 'Una propiedad cerrada no se puede volver a publicar. ¿Continuar?' },
  ],
  CERRADA: [],
};
