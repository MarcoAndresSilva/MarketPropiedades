import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Correo } from './mail.service';

/** Escapa lo que escribió un usuario (nombre, mensaje) antes de meterlo en el HTML. */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Marco común: un párrafo por línea, un botón opcional y la firma. Estilos en línea
// porque la mayoría de los clientes de correo ignora las hojas de estilo.
function plantilla(parrafos: string[], boton?: { texto: string; url: string }): string {
  const cuerpo = parrafos.map((p) => `<p style="margin:0 0 16px">${p}</p>`).join('');
  const cta = boton
    ? `<p style="margin:24px 0"><a href="${boton.url}" style="background:#4B35FF;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">${boton.texto}</a></p>`
    : '';
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#07162B;max-width:520px">${cuerpo}${cta}<p style="margin:24px 0 0;color:#5b6475;font-size:13px">Equipo Habbi</p></div>`;
}

// Textos de cada correo que manda Habbi, con su versión en texto plano (la que se lee en
// clientes sin HTML y la que queda en el log cuando no hay RESEND_API_KEY).
@Injectable()
export class PlantillasCorreo {
  constructor(private readonly config: ConfigService) {}

  // URL pública del frontend, para los links de los correos. FRONTEND_URL no sirve: es
  // la lista de orígenes de CORS y puede traer varios.
  private get appUrl(): string {
    return this.config.get<string>('APP_URL') ?? 'http://localhost:4202';
  }

  verificarEmail(para: string, nombre: string, token: string): Correo {
    const url = `${this.appUrl}/cuenta/verificar?token=${token}`;
    return {
      para,
      asunto: 'Confirma tu correo en Habbi',
      html: plantilla(
        [`Hola ${escaparHtml(nombre)},`, 'Confirma tu correo para empezar a publicar en Habbi. El link vence en 48 horas.'],
        { texto: 'Confirmar correo', url },
      ),
      texto: `Hola ${nombre},\n\nConfirma tu correo para empezar a publicar en Habbi (el link vence en 48 horas):\n${url}`,
    };
  }

  recuperarPassword(para: string, nombre: string, token: string): Correo {
    const url = `${this.appUrl}/cuenta/restablecer?token=${token}`;
    return {
      para,
      asunto: 'Restablece tu contraseña de Habbi',
      html: plantilla(
        [
          `Hola ${escaparHtml(nombre)},`,
          'Pediste restablecer tu contraseña. El link vence en 1 hora.',
          'Si no fuiste tú, ignora este correo: tu contraseña sigue igual.',
        ],
        { texto: 'Elegir contraseña nueva', url },
      ),
      texto: `Hola ${nombre},\n\nPara elegir una contraseña nueva entra a este link (vence en 1 hora):\n${url}\n\nSi no fuiste tú, ignora este correo.`,
    };
  }

  propiedadAprobada(para: string, nombre: string, titulo: string, slug: string): Correo {
    const url = `${this.appUrl}/propiedad/${slug}`;
    return {
      para,
      asunto: 'Tu propiedad ya está publicada en Habbi',
      html: plantilla([`Hola ${escaparHtml(nombre)},`, `Revisamos "${escaparHtml(titulo)}" y ya está publicada.`], {
        texto: 'Ver publicación',
        url,
      }),
      texto: `Hola ${nombre},\n\nRevisamos "${titulo}" y ya está publicada:\n${url}`,
    };
  }

  propiedadRechazada(para: string, nombre: string, titulo: string, motivo: string): Correo {
    return {
      para,
      asunto: 'Tu propiedad necesita cambios',
      html: plantilla([
        `Hola ${escaparHtml(nombre)},`,
        `Revisamos "${escaparHtml(titulo)}" y todavía no podemos publicarla:`,
        `<em>${escaparHtml(motivo)}</em>`,
        'Corrígela desde tu panel y vuelve a enviarla a revisión.',
      ]),
      texto: `Hola ${nombre},\n\nRevisamos "${titulo}" y todavía no podemos publicarla:\n\n${motivo}\n\nCorrígela desde tu panel y vuelve a enviarla a revisión.`,
    };
  }

  propiedadParaRevisar(para: string, titulo: string, anunciante: string): Correo {
    const url = `${this.appUrl}/admin/propiedades`;
    return {
      para,
      asunto: `Propiedad para revisar: ${titulo}`,
      html: plantilla([`${escaparHtml(anunciante)} envió "${escaparHtml(titulo)}" a revisión.`], {
        texto: 'Abrir el panel',
        url,
      }),
      texto: `${anunciante} envió "${titulo}" a revisión.\n${url}`,
    };
  }

  nuevaConsulta(
    para: string,
    consulta: { nombre: string; email: string | null; telefono: string | null; mensaje: string },
    titulo: string,
  ): Correo {
    const contacto = [consulta.email, consulta.telefono].filter(Boolean).join(' · ');
    return {
      para,
      asunto: `Nueva consulta por "${titulo}"`,
      html: plantilla([
        `<strong>${escaparHtml(consulta.nombre)}</strong> (${escaparHtml(contacto)}) preguntó por "${escaparHtml(titulo)}":`,
        escaparHtml(consulta.mensaje).replace(/\n/g, '<br>'),
      ]),
      texto: `${consulta.nombre} (${contacto}) preguntó por "${titulo}":\n\n${consulta.mensaje}`,
    };
  }
}
