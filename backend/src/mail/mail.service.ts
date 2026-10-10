import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Correo {
  para: string;
  asunto: string;
  html: string;
  texto: string;
}

const URL_RESEND = 'https://api.resend.com/emails';
// Remitente de prueba de Resend: funciona sin dominio propio, pero solo entrega a la
// dirección dueña de la cuenta de Resend. Con el dominio verificado se cambia MAIL_FROM.
const REMITENTE_POR_DEFECTO = 'Habbi <onboarding@resend.dev>';

// Envío de correos transaccionales con la API HTTP de Resend (un POST con fetch; no hace
// falta su SDK). Sin RESEND_API_KEY el correo se escribe en el log en vez de enviarse:
// en desarrollo el link de verificación o de recuperación se copia desde la consola.
// Nunca lanza: un correo que falla se registra y el flujo que lo pidió sigue, porque
// cada uno tiene cómo reintentar (reenviar verificación, pedir otro link).
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async enviar(correo: Correo): Promise<boolean> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn(`Sin RESEND_API_KEY, correo no enviado. Para: ${correo.para} · ${correo.asunto}\n${correo.texto}`);
      return false;
    }

    try {
      const res = await fetch(URL_RESEND, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: this.config.get<string>('MAIL_FROM') ?? REMITENTE_POR_DEFECTO,
          to: [correo.para],
          subject: correo.asunto,
          html: correo.html,
          text: correo.texto,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`No se pudo enviar "${correo.asunto}" a ${correo.para}: ${(error as Error).message}`);
      return false;
    }
  }
}
